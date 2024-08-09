import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";

const resolver = new Resolver();

resolver.define("getText", (req) => {
  return "Hello, world!";
});

resolver.define("getRecentProjects", async (req) => {
  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/project/recent`, {
      headers: {
        Accept: "application/json",
      },
    });
  return await response.json();
});

resolver.define("getIssueTypes", async (req) => {
  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/issuetype`, {
      headers: {
        Accept: "application/json",
      },
    });
  return await response.json();
});

resolver.define("getProjectIssueTypes", async (req) => {
  const { projectId } = req.payload;
  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/issuetype/project?projectId=${projectId}`, {
      headers: {
        Accept: "application/json",
      },
    });
  return await response.json();
});

resolver.define("getCustomNumberFields", async (req) => {
  const response = await api.asUser().requestJira(route`/rest/api/3/field`, {
    headers: {
      Accept: "application/json",
    },
  });
  return (await response.json()).filter(
    (field) => field.custom && field.schema && field.schema.type === "number"
  );
});

resolver.define("searchIssues", async (req) => {
  const { project, issueType, numberField } = req.payload;
  const inc = "-12M";

  const jql = issueType
    ? `project = ${project} and issueType = ${issueType} and cf[${numberField}] >= 0 and resolutiondate >= startOfMonth(${inc})`
    : `project = ${project} and cf[${numberField}] >= 0 and resolutiondate >= startOfMonth(${inc})`;

  var bodyData = `{
    "expand": [
    ],
    "fields": [
      "customfield_${numberField}",
      "resolutiondate",
      "issuetype"
    ],
    "fieldsByKeys": false,
    "jql": "${jql}",
    "maxResults": 10000,
    "startAt": 0
  }`;

  const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: bodyData,
  });

  return createResponseValue(await response.json(), numberField, issueType);
});

const createResponseValue = (json, numberField, issueType) => {
  const store = initYearMonthStore(issueTypes(json, issueType));
  json?.issues?.forEach((issue) => {
    const value = issue.fields[`customfield_${numberField}`];
    const resolutionDate = issue.fields.resolutiondate;
    const term = createMonthTermKey(new Date(resolutionDate));
    const issueType = issue.fields.issuetype.name;
    const key = `${term}-${issueType}`;
    store[key].count++;
    store[key].sum += value;
  });
  return Object.keys(store)
    .sort()
    .map((key) => store[key]);
};

const issueTypes = (json, issueType) => {
  const unique = (value, index, array) => array.indexOf(value) === index;
  const ret =
    json?.issues?.map((issue) => issue.fields.issuetype.name).filter(unique) ??
    [];
  return ret == [] ? [issueType] : ret;
};

const initYearMonthStore = (issueTypes) => {
  const store = {};
  const date = new Date();
  for (let i = 0; i <= 12; i++) {
    const term = createMonthTermKey(date);
    issueTypes.forEach((issueType) => {
      const key = `${term}-${issueType}`;
      store[key] = { term: term, count: 0, sum: 0, issueType: issueType };
    });
    date.setMonth(date.getMonth() - 1);
  }
  return store;
};

const createMonthTermKey = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};

export const handler = resolver.getDefinitions();
