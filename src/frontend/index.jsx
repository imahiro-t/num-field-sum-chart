import React, { useEffect, useState } from "react";
import ForgeReconciler, {
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
  RadioGroup,
  DatePicker,
} from "@forge/react";
import { invoke, view } from "@forge/bridge";
import { REPORT_TYPE, TERM_TYPE } from "../const";
const FIELD_NAME_PROJECT = "project";
const FIELD_NAME_ISSUE_TYPE = "issue-type";
const FIELD_NAME_NUMBER_FIELD = "number-field";
const FIELD_NAME_REPORT_TYPE = "report-type";
const FIELD_NAME_TERM_TYPE = "term-type";
const FIELD_NAME_DATE_FROM = "date-from";
const FIELD_NAME_DATE_TO = "date-to";

export const Edit = (props) => {
  const {
    project,
    issueType,
    numberField,
    reportType,
    termType,
    dateFrom,
    dateTo,
  } = props;
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
  const reportTypeOptions = [
    { name: "reportType", value: REPORT_TYPE.MONTHLY, label: "Monthly" },
    { name: "reportType", value: REPORT_TYPE.WEEKLY, label: "Weekly" },
  ];
  const termTypeOptions = [
    { name: "termType", value: TERM_TYPE.PAST_YEAR, label: "Past Year" },
    { name: "termType", value: TERM_TYPE.DATE_RANGE, label: "Date Range" },
  ];

  const { handleSubmit, register, getFieldId } = useForm({
    defaultValues: {
      project: project,
      issueType: issueType,
      numberField: numberField,
      reportType: reportType,
      termType: termType,
      dateFrom: dateFrom,
      dateTo: dateTo,
    },
  });

  const configureGadget = (data) => {
    view.submit(data);
  };

  const close = (data) => {
    view.close(data);
  };

  return (
    <Form onSubmit={handleSubmit(configureGadget)}>
      <FormSection>
        <Box>
          <Label labelFor={getFieldId(FIELD_NAME_PROJECT)}>
            Project
            <RequiredAsterisk />
          </Label>
          <Select
            {...register(FIELD_NAME_PROJECT, {})}
            appearance="default"
            name="project"
            options={projectOptions}
            defaultValue={project}
          />
          <Label labelFor={getFieldId(FIELD_NAME_ISSUE_TYPE)}>
            Issue Type
            <RequiredAsterisk />
          </Label>
          <Select
            {...register(FIELD_NAME_ISSUE_TYPE, {})}
            appearance="default"
            name="issueType"
            options={issueTypeOptions}
            defaultValue={issueType}
          />
          <Label labelFor={getFieldId(FIELD_NAME_NUMBER_FIELD)}>
            Number Field for Chart
            <RequiredAsterisk />
          </Label>
          <Select
            {...register(FIELD_NAME_NUMBER_FIELD, {})}
            appearance="default"
            name="numberField"
            options={numberFieldOptions}
            defaultValue={numberField}
          />
        </Box>
        <Box>
          <Label labelFor={getFieldId(FIELD_NAME_REPORT_TYPE)}>
            Report Type
          </Label>
          <RadioGroup
            {...register(FIELD_NAME_REPORT_TYPE, {})}
            name="reportType"
            options={reportTypeOptions}
            defaultValue={reportType}
          />
        </Box>
        <Box>
          <Label labelFor={getFieldId(FIELD_NAME_TERM_TYPE)}>Term Type</Label>
          <RadioGroup
            {...register(FIELD_NAME_TERM_TYPE, {})}
            name="termType"
            options={termTypeOptions}
            defaultValue={termType}
          />
          <Label labelFor={getFieldId(FIELD_NAME_DATE_FROM)}>From</Label>
          <DatePicker
            {...register(FIELD_NAME_DATE_FROM, {})}
            name="dateFrom"
            defaultValue={dateFrom}
            weekStartDay={1}
            dateFormat="YYYY-MM-DD"
          />
          <Label labelFor={getFieldId(FIELD_NAME_DATE_TO)}>To</Label>
          <DatePicker
            {...register(FIELD_NAME_DATE_TO, {})}
            name="dateTo"
            defaultValue={dateTo}
            weekStartDay={1}
            dateFormat="YYYY-MM-DD"
          />
        </Box>
      </FormSection>
      <FormFooter>
        <Button onClick={close} appearance="subtle">
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
  const {
    project,
    issueType,
    numberField,
    reportType,
    termType,
    dateFrom,
    dateTo,
  } = props;

  const currentDate = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  useEffect(() => {
    if (project && issueType && numberField) {
      invoke("searchIssues", {
        project: project.value,
        issueType: issueType.value,
        numberField: numberField.value,
        reportType: reportType,
        dateFromStr:
          termType === TERM_TYPE.PAST_YEAR ? formatDate(oneYearAgo) : dateFrom,
        dateToStr:
          termType === TERM_TYPE.PAST_YEAR ? formatDate(currentDate) : dateTo,
      }).then(setIssueResponseJson);
    }
  }, []);

  return (
    issueResponseJson && (
      <>
        <Box paddingInline="space.300">
          <LineChart
            title={`Sum of ${numberField.label}`}
            data={convertForSum(issueResponseJson)}
            xAccessor={0}
            yAccessor={1}
            colorAccessor={2}
          />
        </Box>
        <Box padding="space.100" />
        <Box paddingInline="space.300">
          <LineChart
            title={`Issue Count of ${numberField.label}`}
            data={convertForCount(issueResponseJson)}
            xAccessor={0}
            yAccessor={1}
            colorAccessor={2}
          />
        </Box>
        <Box padding="space.100" />
        <Box paddingInline="space.300">
          <DynamicTable
            caption={`List of ${numberField.label}`}
            head={head}
            rows={createRows(issueResponseJson)}
            rowsPerPage={20}
          />
        </Box>
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

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createFromDefaultValue = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return formatDate(date);
};

const createToDefaultValue = () => {
  const date = new Date();
  return formatDate(date);
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
  const reportType =
    gadgetConfiguration[FIELD_NAME_REPORT_TYPE] ?? REPORT_TYPE.MONTHLY;
  const termType =
    gadgetConfiguration[FIELD_NAME_TERM_TYPE] ?? TERM_TYPE.PAST_YEAR;
  const dateFrom =
    gadgetConfiguration[FIELD_NAME_DATE_FROM] ?? createFromDefaultValue();
  const dateTo =
    gadgetConfiguration[FIELD_NAME_DATE_TO] ?? createToDefaultValue();

  return context.extension.entryPoint === "edit" ? (
    <Edit
      project={project}
      issueType={issueType}
      numberField={numberField}
      reportType={reportType}
      termType={termType}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  ) : (
    <View
      project={project}
      issueType={issueType}
      numberField={numberField}
      reportType={reportType}
      termType={termType}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
