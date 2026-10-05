# UI5 BW Explorer

A SAPUI5 (OpenUI5) freestyle app that browses SAP BW/4HANA style sales data. It reads from an OData-style API such as [bw-query-assistant](https://github.com/Lakshminarayana7844/bw-query-assistant), and falls back to built-in sample data when no API is running, so it works offline.

[![CI](https://github.com/Lakshminarayana7844/ui5-bw-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/Lakshminarayana7844/ui5-bw-explorer/actions/workflows/ci.yml)

## Features

- Filter bar: region, material, minimum quantity
- Table with paging (20 rows), sorted by net value
- Summary panel: row count, total net value, units, net value by region
- Live mode (OData `$filter`, `$orderby`, `$top`, `$skip`, `$count`) and offline mock mode, shown in the summary header

## Structure

```
webapp/
  Component.js, manifest.json, index.html
  view/Main.view.xml            filter bar, summary, table
  controller/Main.controller.js load, paging, live/mock switch
  model/queryBuilder.js         pure functions: $filter builder, mock engine, summary
  localService/mockdata.js      sample data (270 rows)
test/queryBuilder.test.js       12 unit tests (Node test runner)
```

`queryBuilder.js` has no UI dependencies, so the query logic is tested without a browser.

## Run

```bash
npm test                  # unit tests
npx http-server webapp -p 8080
```

Open http://localhost:8080. Options in the URL:

- `?mock=true` always use the sample data
- `?api=http://localhost:8000/odata` point to another OData-style service (default is set in `manifest.json`)

With bw-query-assistant running on port 8000 the app shows "live API". Allow CORS on the API if you serve the UI from another origin.

Docker:

```bash
docker build -t ui5-bw-explorer .
docker run -p 8080:80 ui5-bw-explorer
```

## Notes

- UI5 is loaded from the OpenUI5 CDN (1.120.30, Horizon theme).
- The $filter builder escapes single quotes and ignores a non numeric quantity.
