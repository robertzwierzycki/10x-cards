/**
 * Profile Service
 *
 * Provides business logic for profile-related operations including
 * retrieving and updating user profiles with email from Supabase Auth.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import type { ProfileDTO, UpdateProfileCommand } from "@/types";

/**
 * Custom error for username conflicts
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Custom error for not found resources
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Service class for profile operations
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves user profile with email from Supabase Auth
   *
   * @param userId - UUID of the authenticated user
   * @returns ProfileDTO with user profile data including email
   * @throws NotFoundError if profile doesn't exist
   *
   * @remarks
   * Email is fetched from Supabase Auth using getUser() as it's not stored
   * in the profiles table. The profiles table only contains username and timestamps.
   */
  async getProfile(userId: string): Promise<ProfileDTO> {
    try {
      // Fetch profile data from profiles table
      const { data: profileData, error: profileError } = await this.supabase
        .from("profiles")
        .select("id, username, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        console.error("[ProfileService] Error fetching profile:", profileError);
        throw new NotFoundError("Profile not found");
      }

      // Fetch email from Supabase Auth
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError || !user || user.id !== userId) {
        console.error("[ProfileService] Error fetching user from auth:", authError);
        throw new NotFoundError("Profile not found");
      }

      // Construct ProfileDTO
      const profile: ProfileDTO = {
        id: profileData.id,
        username: profileData.username,
        email: user.email || "",
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      };

      return profile;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("[ProfileService] Unexpected error in getProfile:", error);
      throw new Error("Failed to retrieve profile");
    }
  }

  /**
   * Updates user profile (currently only username)
   *
   * @param userId - UUID of the authenticated user
   * @param command - Update command with optional username
   * @returns Updated ProfileDTO
   * @throws ConflictError if username is already taken
   * @throws NotFoundError if profile doesn't exist
   *
   * @remarks
   * - Checks username uniqueness (case-insensitive) before updating
   * - Returns full profile data after successful update
   * - Username is trimmed before checking and storing
   */
  async updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDTO> {
    try {
      // If username provided, validate uniqueness
      if (command.username) {
        const trimmedUsername = command.username.trim();

        // Check if username already exists (case-insensitive, excluding current user)
        const { data: existing, error: checkError } = await this.supabase
          .from("profiles")
          .select("id")
          .ilike("username", trimmedUsername)
          .neq("id", userId)
          .maybeSingle();

        if (checkError) {
          console.error("[ProfileService] Error checking username uniqueness:", checkError);
          throw new Error("Failed to verify username uniqueness");
        }

        if (existing) {
          throw new ConflictError("Username already taken");
        }

        // Update the profile with new username
        const { error: updateError } = await this.supabase
          .from("profiles")
          .update({ username: trimmedUsername })
          .eq("id", userId);

        if (updateError) {
          console.error("[ProfileService] Error updating profile:", updateError);
          throw new Error("Failed to update profile");
        }
      }

      // Return updated profile
      return this.getProfile(userId);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("[ProfileService] Unexpected error in updateProfile:", error);
      throw new Error("Failed to update profile");
    }
  }
}
