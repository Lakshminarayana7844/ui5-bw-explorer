sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "../model/queryBuilder"
], function (Controller, JSONModel, MessageToast, QB) {
  "use strict";

  var PAGE = 20;

  return Controller.extend("bw.explorer.controller.Main", {
    onInit: function () {
      this._skip = 0;
      this.getView().setModel(new JSONModel({
        filters: { Region: "", Material: "", minQuantity: "" },
        rows: [], count: 0, summary: { rows: 0, netValue: 0, quantity: 0, regions: [] },
        source: "", page: "", busy: false
      }));
      this._load();
    },

    onSearch: function () { this._skip = 0; this._load(); },

    onReset: function () {
      this.getView().getModel().setProperty("/filters", { Region: "", Material: "", minQuantity: "" });
      this.onSearch();
    },

    onNext: function () {
      var m = this.getView().getModel();
      if (this._skip + PAGE < m.getProperty("/count")) { this._skip += PAGE; this._load(); }
    },

    onPrev: function () {
      if (this._skip > 0) { this._skip = Math.max(0, this._skip - PAGE); this._load(); }
    },

    _apiBase: function () {
      var q = new URLSearchParams(window.location.search);
      return q.get("api") || this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/bw/uri");
    },

    _load: function () {
      var that = this, m = this.getView().getModel();
      var filters = m.getProperty("/filters"), paging = { top: PAGE, skip: this._skip };
      var forceMock = new URLSearchParams(window.location.search).get("mock") === "true";
      m.setProperty("/busy", true);

      var live = forceMock ? Promise.reject(new Error("mock forced")) :
        fetch(this._apiBase() + "/ZSD_C01?" + QB.buildQuery(filters, paging))
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
          .then(function (j) { return { source: "live API", count: j["@odata.count"], value: j.value }; });

      live.catch(function () {
        var res = QB.applyMock(window.MOCK_SALES || [], filters, paging);
        return { source: "offline mock data", count: res.count, value: res.value, all: res.all };
      }).then(function (res) {
        var all = res.all || res.value;
        m.setProperty("/rows", res.value);
        m.setProperty("/count", res.count);
        m.setProperty("/source", res.source);
        m.setProperty("/summary", QB.summarize(all));
        var from = res.count ? that._skip + 1 : 0;
        m.setProperty("/page", from + "-" + Math.min(that._skip + PAGE, res.count) + " of " + res.count);
        m.setProperty("/busy", false);
        if (res.source !== "live API") { MessageToast.show("Showing offline mock data"); }
      });
    }
  });
});
