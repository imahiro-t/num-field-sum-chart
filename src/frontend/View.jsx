import React, { useEffect, useState } from "react";
import { Box, LineChart, DynamicTable } from "@forge/react";
import { invoke } from "@forge/bridge";
import { TERM_TYPE } from "../const";
import { formatDate } from "../util";

const View = (props) => {
  const [issueResponseJson, setIssueResponseJson] = useState();
  const {
    project,
    issueType,
    numberField,
    dateTimeField,
    reportType,
    termType,
    dateFrom,
    dateTo,
  } = props;

  const currentDate = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  useEffect(() => {
    if (project && issueType && numberField && dateTimeField) {
      invoke("searchIssues", {
        project: project.value,
        issueType: issueType.value,
        numberField: numberField.value,
        dateTimeField: dateTimeField.value,
        reportType: reportType,
        dateFromStr:
          termType === TERM_TYPE.PAST_YEAR ? formatDate(oneYearAgo) : dateFrom,
        dateToStr:
          termType === TERM_TYPE.PAST_YEAR ? formatDate(currentDate) : dateTo,
      }).then(setIssueResponseJson);
    }
  }, []);

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

export default View;
