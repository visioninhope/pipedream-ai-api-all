import constants from "../../common/constants.mjs";
import common from "../common/webhook.mjs";

export default {
  ...common,
  key: "linear_app-issue-updated-instant",
  name: "New Updated Issue (Instant)",
  description: "Emit new event when an issue is updated. See the docs [here](https://developers.linear.app/docs/graphql/webhooks)",
  type: "source",
  version: "0.3.6",
  dedupe: "unique",
  methods: {
    ...common.methods,
    getResourceTypes() {
      return [
        constants.RESOURCE_TYPE.ISSUE,
      ];
    },
    getWebhookLabel() {
      return "Issue updated";
    },
    getResourcesFn() {
      return this.linearApp.listIssues;
    },
    getResourcesFnArgs() {
      return {
        orderBy: "updatedAt",
        filter: {
          team: {
            id: {
              in: this.teamIds,
            },
          },
          project: {
            id: {
              eq: this.projectId,
            },
          },
        },
      };
    },
    getMetadata(resource) {
      const {
        delivery,
        title,
        data,
        updatedAt,
      } = resource;
      return {
        id: delivery || resource.id,
        summary: `Issue Updated: ${data?.title || title}`,
        ts: Date.parse(updatedAt),
      };
    },
  },
};
