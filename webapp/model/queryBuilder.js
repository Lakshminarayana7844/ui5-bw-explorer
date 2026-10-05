/* Pure helpers: build OData query strings and summarize rows.
 * Works inside UI5 (sap.ui.define) and in Node (module.exports) so it can be unit tested. */
(function (root, factory) {
  if (typeof sap !== "undefined" && sap.ui && sap.ui.define) {
    sap.ui.define([], factory);
  } else {
    module.exports = factory();
  }
})(this, function () {
  "use strict";

  function quote(v) {
    return "'" + String(v).replace(/'/g, "''") + "'";
  }

  /** filters: {Region, Material, minQuantity}; returns the $filter string or "" */
  function buildFilter(filters) {
    var parts = [];
    if (filters.Region) parts.push("Region eq " + quote(filters.Region));
    if (filters.Material) parts.push("Material eq " + quote(filters.Material));
    var q = Number(filters.minQuantity);
    if (filters.minQuantity !== "" && filters.minQuantity != null && !isNaN(q)) {
      parts.push("Quantity ge " + q);
    }
    return parts.join(" and ");
  }

  function buildQuery(filters, paging) {
    var p = new URLSearchParams();
    var f = buildFilter(filters || {});
    if (f) p.set("$filter", f);
    p.set("$orderby", "NetValue desc");
    p.set("$top", String((paging && paging.top) || 20));
    p.set("$skip", String((paging && paging.skip) || 0));
    p.set("$count", "true");
    return p.toString();
  }

  /** Same semantics as the server for the filters above, used by the offline mock mode. */
  function applyMock(rows, filters, paging) {
    var out = rows.filter(function (r) {
      if (filters.Region && r.Region !== filters.Region) return false;
      if (filters.Material && r.Material !== filters.Material) return false;
      var q = Number(filters.minQuantity);
      if (filters.minQuantity !== "" && filters.minQuantity != null && !isNaN(q) && r.Quantity < q) return false;
      return true;
    });
    out = out.slice().sort(function (a, b) { return b.NetValue - a.NetValue; });
    var skip = (paging && paging.skip) || 0;
    var top = (paging && paging.top) || 20;
    return { count: out.length, value: out.slice(skip, skip + top), all: out };
  }

  function summarize(rows) {
    var byRegion = {};
    var total = 0, qty = 0;
    rows.forEach(function (r) {
      total += r.NetValue;
      qty += r.Quantity;
      byRegion[r.Region] = (byRegion[r.Region] || 0) + r.NetValue;
    });
    var regions = Object.keys(byRegion).sort().map(function (k) {
      return { Region: k, NetValue: Math.round(byRegion[k] * 100) / 100 };
    });
    return { rows: rows.length, netValue: Math.round(total * 100) / 100, quantity: qty, regions: regions };
  }

  return { buildFilter: buildFilter, buildQuery: buildQuery, applyMock: applyMock, summarize: summarize };
});
