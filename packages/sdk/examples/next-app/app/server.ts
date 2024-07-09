"use server";

import { createClient } from "../../../src";

const {
  PIPEDREAM_PROJECT_SECRET_KEY, NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID,
} = process.env;

if (!PIPEDREAM_PROJECT_SECRET_KEY) {
  throw new Error("PIPEDREAM_PROJECT_SECRET_KEY not set in environment");
}

if (!NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID) {
  throw new Error("NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID not set in environment");
}

const pd = createClient({
  secretKey: PIPEDREAM_PROJECT_SECRET_KEY,
  apiHost: process.env.PIPEDREAM_API_HOST,
});

export async function serverConnectTokenCreate(clientUserId: string) {
  return pd.connectTokenCreate({
    clientUserId,
  });
}

export async function getAppsData(clientUserId: string) {
  const [
    github,
  ] = await Promise.all([
    getGithubData(clientUserId),
  ]);
  return {
    github,
  };
}

export async function getGithubData(clientUserId: string) {
  if (!NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID) {
    throw new Error("NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID not set in environment");
  }
  const data = await pd.getAccount({
    app: NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID,
    clientUserId,
  }, {
    includeCredentials: true,
  });
  if (!data?.accounts.length) {
    return null;
  }
  const account = data.accounts[data.accounts.length - 1]
  const resp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${account.credentials.oauth_access_token}`,
    },
  });
  const res = await resp.json();

  return res;
}
