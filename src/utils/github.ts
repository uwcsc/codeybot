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

// Get repository information
export const getRepositoryInfo = async (owner: string, repo: string): Promise<GitHubRepository> => {
  const response = axios.get(`${API_LINK}/repos/${owner}/${repo}`, {
    params: {
      auth: process.env.GITHUB_ACCESS_TOKEN
    }
  });
  return (await response).data;
};

// Get repository releases
export const getRepositoryReleases = async (owner: string, repo: string): Promise<GithubRepositoryRelease[]> => {
  const response = axios.get(`${API_LINK}/repos/${owner}/${repo}/releases`, {
    params: {
      auth: process.env.GITHUB_ACCESS_TOKEN
    }
  });
  return (await response).data;
};
