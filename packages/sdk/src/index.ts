type CreateServerClientOpts = {
  apiHost?: string;
  environment?: string;
  publicKey: string;
  secretKey: string;
};

export type ConnectTokenCreateOpts = {
  app_slug: string;
  oauth_client_id?: string;
  client_name?: string;
  external_id: string;
};

export type ConnectTokenResponse = {
  token: string;
  expires_at: string;
};

type AccountId = string;
type AccountKeyFields = {
  externalId: string;
  appId: string;
};
type AccountKey = AccountId | AccountKeyFields;

export function createClient(opts: CreateServerClientOpts) {
  return new ServerClient(opts);
}

class ServerClient {
  environment?: string;
  secretKey: string;
  publicKey: string;
  baseURL: string;

  constructor(opts: CreateServerClientOpts) {
    this.environment = opts.environment;
    this.secretKey = opts.secretKey;
    this.publicKey = opts.publicKey;

    const { apiHost = "api.pipedream.com" } = opts;
    this.baseURL = `https://${apiHost}`;
  }

  private _authorizationHeader(): string {
    const encoded = Buffer
      .from(`${this.publicKey}:${this.secretKey}`)
      .toString("base64");
    return `Basic ${encoded}`;
  }

  async connectTokenCreate(opts: ConnectTokenCreateOpts): Promise<ConnectTokenResponse> {
    const auth = this._authorizationHeader();
    const resp = await fetch(`${this.baseURL}/v1/connect/tokens`, {
      method: "POST",
      headers: {
        "authorization": auth,
        "content-type": "application/json",
      },
      body: JSON.stringify(opts),
    });

    return resp.json();
  }

  async getAccount(key: AccountKey, opts?: { includeCredentials?: boolean; }) {
    let url: string;
    let id: string | undefined;
    const baseAccountURL = `${this.baseURL}/v1/accounts`;
    if (typeof key === "string") {
      id = key;
      url = `${baseAccountURL}/${id}`;
    } else {
      url = `${baseAccountURL}?app=${key.appId}&limit=100&external_id=${key.externalId}`;
    }
    if (opts?.includeCredentials) {
      url += `${id
        ? "?"
        : "&"}include_credentials=1`;
    }
    const resp = await fetch(url, {
      headers: {
        Authorization: this._authorizationHeader(),
      },
    });
    const res = await resp.json();
    const {
      data, error,
    } = res;
    if (error) {
      if (error === "record not found") {
        return null;
      }
      throw new Error(error);
    }
    return data;
  }
}
