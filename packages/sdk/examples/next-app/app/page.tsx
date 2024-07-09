"use client"

import { createRef, useEffect, useState } from "react";
import { serverConnectTokenCreate, getAppsData } from "./server"
import { createClient } from "../../../src/browser"

const publicKey = process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_PUBLIC_KEY
const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST
const oauthAppId = process.env.NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID

if (!publicKey) throw new Error("Missing NEXT_PUBLIC_PIPEDREAM_PROJECT_PUBLIC_KEY env var")
if (!oauthAppId) throw new Error("Missing NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID env var")

const pd = createClient({ publicKey, frontendHost })

export default function Home() {
  const [externalUserId, setExternalUserId] = useState<string | null>(null)
  const [githubData, setGithubData] = useState<{ login: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [oa, setOauthAppId] = useState<string | null>(null)
  const [apn, setAuthProvisionId] = useState<string | null>(null)
  const inputRef = createRef<HTMLInputElement>()

  const connectApp = (oauthAppId: string) => {
    if (!externalUserId || !token) return
    pd.startConnect({
      app: oauthAppId,
      token,
      onSuccess: ({ id: authProvisionId }: any) => {
        setOauthAppId(oauthAppId)
        setAuthProvisionId(authProvisionId as string)
      }
    })
  }

  const connectGitHub = async () => {
    if (oauthAppId) connectApp(oauthAppId)
    else console.error("Missing NEXT_PUBLIC_PIPEDREAM_TEST_APP_ID env var")
  }

  const signIn = () => {
    setExternalUserId(inputRef.current?.value || "")
  }

  const signOut = () => {
    setExternalUserId(null)
  }

  // Reactive Effects
  useEffect(() => {
    if (!externalUserId) {
      setToken(null)
      setGithubData(null)
      setOauthAppId(null)
      setAuthProvisionId(null)
    } else {
      getAppsData(externalUserId).then((d) => {
        console.log('Github App Data? :>> ', d);
        setGithubData(d.github)
      })
    }
  }, [externalUserId])

  useEffect(() => {
    if (!externalUserId) return
    serverConnectTokenCreate(externalUserId).then((t) => setToken(t))
  }, [externalUserId])


  return (
    <main className="p-5 flex flex-col gap-2">
      <h1 className="text-2xl font-bold">Pipedream connect Next.js demo</h1>
      {
        externalUserId ?
          <div>
            <p>External User Id: {externalUserId} </p>
            <p>Token: {token}</p>

            {apn ?
              <div>
                <p>
                  Auth Provision Id: {apn}
                </p>
                <p>
                  Oauth App Id: {oa}
                </p>
                <p>
                  <button onClick={signOut} style={{ all: "revert" }}>Sign out</button>
                </p>
              </div>
              : <button style={{ all: "revert" }} onClick={connectGitHub}>Connect your GitHub account</button>
            }
            {
              githubData?.login &&
              <p className="pt-2">Your GitHub username:
                <span><b>{githubData.login}</b></span>
              </p>
            }
            <p>
            </p>
          </div>
          :
          <div>
            <p>
              <input className="border" ref={inputRef} placeholder="External user id" />
            </p>
            <p>
              <button onClick={signIn} style={{ all: "revert" }}>Sign in</button>
            </p>
          </div>

      }
    </main>
  );
}
