/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, Event, Uri } from "vscode";

export interface GitBaseExtension {
  /**
   * Returns a specific API version.
   * @param version Version number.
   * @returns API instance or undefined if not available.
   */
  getAPI(version: 1): GitBaseAPI;
}

export interface GitBaseAPI {
  /**
   * Get remote sources (repositories) from various Git providers.
   * @param options Options for filtering and pagination.
   * @returns Promise with array of remote sources.
   */
  getRemoteSources(options?: GetRemoteSourcesOptions): Promise<RemoteSource[]>;

  /**
   * Pick a remote source (repository) from available providers.
   * @param options Options for filtering the picker.
   * @returns Promise with selected remote source or undefined if cancelled.
   */
  pickRemoteSource(options?: PickRemoteSourceOptions): Promise<RemoteSource | undefined>;

  /**
   * Register a remote source provider.
   * @param provider The provider to register.
   * @returns Disposable to unregister the provider.
   */
  registerRemoteSourceProvider(provider: RemoteSourceProvider): Disposable;
}

export interface GetRemoteSourcesOptions {
  /**
   * Filter by provider name (e.g., 'github', 'gitlab', 'bitbucket').
   */
  providerName?: string;

  /**
   * Search query string.
   */
  query?: string;

  /**
   * Maximum number of results.
   */
  limit?: number;

  /**
   * Filter by organization/user.
   */
  owner?: string;
}

export interface PickRemoteSourceOptions extends GetRemoteSourcesOptions {
  /**
   * Placeholder text for the quick pick.
   */
  placeholder?: string;

  /**
   * Title for the quick pick.
   */
  title?: string;
}

export interface RemoteSource {
  /**
   * Unique identifier for the remote source.
   */
  readonly name: string;

  /**
   * Human-readable description.
   */
  readonly description?: string;

  /**
   * Clone URL (HTTPS).
   */
  readonly url: string | Uri;

  /**
   * Optional icon for the remote source.
   */
  readonly icon?: string | { light: Uri; dark: Uri };

  /**
   * Optional detail text (shown in quick pick).
   */
  readonly detail?: string;

  /**
   * Provider name (e.g., 'github', 'gitlab').
   */
  readonly providerName?: string;

  /**
   * Owner/organization of the repository.
   */
  readonly owner?: string;

  /**
   * Repository name.
   */
  readonly repository?: string;

  /**
   * Default branch name.
   */
  readonly defaultBranch?: string;

  /**
   * Is the repository private?
   */
  readonly isPrivate?: boolean;
}

export interface RemoteSourceProvider {
  /**
   * Unique name for the provider (e.g., 'custom-gitlab').
   */
  readonly name: string;

  /**
   * Human-readable icon or label for the provider.
   */
  readonly icon?: string | { light: Uri; dark: Uri };

  /**
   * Optional support for authentication.
   */
  readonly supportsAuthentication?: boolean;

  /**
   * Get remote sources from this provider.
   * @param query Search query.
   * @returns Promise with array of remote sources.
   */
  getRemoteSources(query?: string): Promise<RemoteSource[]>;

  /**
   * Get branches for a specific remote source.
   * @param remoteSource The remote source.
   * @returns Promise with array of branch names.
   */
  getBranches?(remoteSource: RemoteSource): Promise<string[]>;

  /**
   * Optional event fired when remote sources change.
   */
  readonly onDidChangeRemoteSources?: Event<void>;
}
