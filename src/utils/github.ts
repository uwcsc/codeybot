// Utils for the GitHub API

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_LINK = 'https://api.github.com';

export interface GitHubRepository {
  name: string;
  full_name: string;
  owner: {
    avatar_url: string;
  };
  html_url: string;
}

export interface GithubRepositoryRelease {
  tag_name: string;
}

//set date to 0 as unix start time
let RepoRefreshDate = new Date(0);
let ghRepo: GitHubRepository | null = null;

// Get repository information
export const getRepositoryInfo = async (owner: string, repo: string): Promise<GitHubRepository> => {
  const curTime = new Date();
  //8640000 is a day of delay
  if (ghRepo == null || curTime.getTime() - RepoRefreshDate.getTime() > 86400000) {
    RepoRefreshDate = curTime;
    const response = axios.get(`${API_LINK}/repos/${owner}/${repo}`);
    ghRepo = (await response).data;
  }
  return ghRepo!;
};

//set date to 0 as unix start time
let ReleaseRefreshDate = new Date(0);
let ghRelease: GithubRepositoryRelease[] | null = null;

// Get repository releases
export const getRepositoryReleases = async (
  owner: string,
  repo: string,
): Promise<GithubRepositoryRelease[]> => {
  const curTime = new Date();
  //8640000 is a day of delay
  if (ghRepo == null || curTime.getTime() - ReleaseRefreshDate.getTime() > 86400000) {
    ReleaseRefreshDate = curTime;
    const response = axios.get(`${API_LINK}/repos/${owner}/${repo}/releases`);
    ghRelease = (await response).data;
  }
  return ghRelease!;
};
