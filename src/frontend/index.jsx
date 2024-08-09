import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Text,
  useProductContext,
  Select,
  Form,
  Button,
  Box,
  FormSection,
  FormFooter,
  Label,
  useForm,
  RequiredAsterisk,
  LineChart,
  DynamicTable,
} from "@forge/react";
import { invoke, view } from "@forge/bridge";
const FIELD_NAME_PROJECT = "project";
const FIELD_NAME_ISSUE_TYPE = "issue-type";
const FIELD_NAME_NUMBER_FIELD = "number-field";

export const Edit = (props) => {
  const { project, issueType, numberField } = props;
  const [projectResponseJson, setProjectResponseJson] = useState();
  const [issueTypeResponseJson, setIssueTypeResponseJson] = useState();
  const [numberFieldResponseJson, setNumberFieldResponseJson] = useState();

  useEffect(() => {
    invoke("getRecentProjects", {}).then(setProjectResponseJson);
    invoke("getIssueTypes", {}).then(setIssueTypeResponseJson);
    invoke("getCustomNumberFields", {}).then(setNumberFieldResponseJson);
  }, []);

  const projectOptions = projectResponseJson
    ? projectResponseJson.map((project) => ({
        label: project.name,
        value: project.id,
      }))
    : [];
  const issueTypeOptions = issueTypeResponseJson
    ? [{ label: "ALL ISSUE TYPES", value: "" }].concat(
        issueTypeResponseJson.map((issueType) => ({
          label: issueType.name,
          value: issueType.name,
        }))
      )
    : [];
  const numberFieldOptions = numberFieldResponseJson
    ? numberFieldResponseJson.map((numericField) => ({
        label: numericField.name,
        value: numericField.schema.customId,
      }))
    : [];

  const { handleSubmit, register, getFieldId } = useForm();

  const configureGadget = (data) => {
    view.submit(data);
  };

  const close = (data) => {
    view.close(data);
  };

  return (
    <Form onSubmit={handleSubmit(configureGadget)}>
      <FormSection>
        <Label labelFor={getFieldId(FIELD_NAME_PROJECT)}>
          Project
          <RequiredAsterisk />
        </Label>
        <Select
          {...register(FIELD_NAME_PROJECT, { required: true })}
          appearance="default"
          name="project"
          options={projectOptions}
          defaultValue={project}
        />
      </FormSection>
      <FormSection>
        <Label labelFor={getFieldId(FIELD_NAME_ISSUE_TYPE)}>
          Issue Type
          <RequiredAsterisk />
        </Label>
        <Select
          {...register(FIELD_NAME_ISSUE_TYPE, { required: true })}
          appearance="default"
          name="issueType"
          options={issueTypeOptions}
          defaultValue={issueType}
        />
      </FormSection>
      <FormSection>
        <Label labelFor={getFieldId(FIELD_NAME_NUMBER_FIELD)}>
          Number Field for Chart
          <RequiredAsterisk />
        </Label>
        <Select
          {...register(FIELD_NAME_NUMBER_FIELD, { required: true })}
          appearance="default"
          name="numberField"
          options={numberFieldOptions}
          defaultValue={numberField}
        />
      </FormSection>
      <FormFooter>
        <Button appearance="default" type="button" onClick={close}>
          Cancel
        </Button>
        <Button appearance="primary" type="submit">
          Save
        </Button>
      </FormFooter>
      <Box padding="space.1000" />
    </Form>
  );
};

const View = (props) => {
  const [issueResponseJson, setIssueResponseJson] = useState();
  const { project, issueType, numberField } = props;

  useEffect(() => {
    if (project && issueType && numberField) {
      invoke("searchIssues", {
        project: project.value,
        issueType: issueType.value,
        numberField: numberField.value,
      }).then(setIssueResponseJson);
    }
  }, []);

  return (
    issueResponseJson && (
      <>
        <LineChart
          title={`Sum of ${numberField.label}`}
          data={convertForSum(issueResponseJson)}
          xAccessor={0}
          yAccessor={1}
          colorAccessor={2}
        />
        <Box padding="space.100" />
        <LineChart
          title={`Issue Count of ${numberField.label}`}
          data={convertForCount(issueResponseJson)}
          xAccessor={0}
          yAccessor={1}
          colorAccessor={2}
        />
        <Box padding="space.100" />
        <DynamicTable
          caption={`List of ${numberField.label}`}
          head={head}
          rows={createRows(issueResponseJson)}
          rowsPerPage={20}
        />
      </>
    )
  );
};

const convertForSum = (values) => {
  return values.map((value) => [value.term, value.sum, value.issueType]);
};

const convertForCount = (values) => {
  return values.map((value) => [value.term, value.count, value.issueType]);
};

const createKey = (input) => {
  return input ? input.replace(/^(the|a|an)/, "").replace(/\s/g, "") : input;
};

const createRows = (values) => {
  return values.reverse().map((value, index) => ({
    key: `row-${index}-${value.term}`,
    cells: [
      {
        key: value.term,
        content: value.term,
      },
      {
        key: createKey(value.issueType),
        content: value.issueType,
      },
      {
        key: value.count,
        content: value.count,
      },
      {
        key: value.sum,
        content: value.sum,
      },
    ],
  }));
};

const head = {
  cells: [
    {
      key: "term",
      content: "Term",
      isSortable: true,
    },
    {
      key: "issueType",
      content: "Issue Type",
      shouldTruncate: true,
      isSortable: true,
    },
    {
      key: "count",
      content: "Issue Count",
      isSortable: true,
    },
    {
      key: "sum",
      content: "Sum",
      isSortable: true,
    },
  ],
};

const App = () => {
  const context = useProductContext();
  if (!context) {
    return "Loading...";
  }
  const {
    extension: { gadgetConfiguration },
  } = context;
  const project = gadgetConfiguration[FIELD_NAME_PROJECT];
  const issueType = gadgetConfiguration[FIELD_NAME_ISSUE_TYPE];
  const numberField = gadgetConfiguration[FIELD_NAME_NUMBER_FIELD];

  return context.extension.entryPoint === "edit" ? (
    <Edit project={project} issueType={issueType} numberField={numberField} />
  ) : (
    <View project={project} issueType={issueType} numberField={numberField} />
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
