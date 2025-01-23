// This script collects and downloads user's information, downloads on your computer, and you have full control over it
// It is used to safely transfer an account from a user to another user
// Please do not share this file unless you trust the user
// Collected information includes:
// nickname, browser/PC info, timezone/location..

(function () {
  "use strict";

  function observeElement(selector, callback) {
    const observer = new MutationObserver(function (mutation) {
      mutation.forEach(function () {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          observer.disconnect();
          callback(elements);
        }
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function extractUsername(text) {
    const pattern = /^\[.*?\]\s*(.*)$|^(.*)$/;
    const match = text.match(pattern);
    if (match) {
      if (match[1]) {
        return match[1];
      }
      if (match[2]) {
        return match[2];
      }
    }
    return null;
  }

  function downloadFile(filename, data) {
    const base64Data = btoa(unescape(encodeURIComponent(data)));
    const blob = new Blob([base64Data], { type: "text/plain" });
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getWebGLInfo() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl");
    if (!context) {
      return { error: "no WebGL" };
    }
    const webglInfo = context.getExtension("WEBGL_debug_renderer_info");
    if (webglInfo) {
      return {
        vendor: context.getParameter(webglInfo.UNMASKED_VENDOR_WEBGL),
        renderer: context.getParameter(webglInfo.UNMASKED_RENDERER_WEBGL),
      };
    } else {
      return { error: "no WEBGL_debug_renderer_info" };
    }
  }

  function collectUserInfo() {
    const usernameElement = document.querySelector(".UserInfoContainerStyle-textDecoration");
    const rankIconElement = document.querySelector(".UserInfoContainerStyle-titleRankIcon");

    if (!usernameElement) {
      observeElement(".UserInfoContainerStyle-textDecoration", function () {
        collectUserInfo();
      });
      return;
    }

    const data = {};
    const usernameText = usernameElement.textContent.trim();
    const username = extractUsername(usernameText);

    if (!username) {
      console.log("Username not found");
      setTimeout(collectUserInfo, 1000);
      return;
    }

    const navigatorInfo = window.navigator;
    const dateTimeInfo = Intl.DateTimeFormat().resolvedOptions();
    const isMobile = /Mobi|Android/i.test(navigatorInfo.userAgent);
    const hasTouchscreen = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    const lang = navigatorInfo.languages.length > 0 ? navigatorInfo.languages[0].split("-")[0] : "unknown";
    const deviceMemory = navigator.deviceMemory || 0;

    data.username = username;
    data.resources = "https://s.eu.tankionline.com";
    data.config_template = "https://c{server}.eu.tankionline.com/config.xml";
    data.balancer = "https://tankionline.com/s/status.js/";
    data.lang = lang;
    data.browser_user_agent = navigatorInfo.userAgent;
    data.os = navigatorInfo.platform;
    data.device_type = "Desktop";
    data.client_type = "BROWSER";
    data.hardware_concurrency = navigatorInfo.hardwareConcurrency.toString();
    data.time_zone = dateTimeInfo.timeZone;
    data.video_card = getWebGLInfo().renderer;
    data.mobile_device = isMobile ? "true" : "false";
    data.touchscreen_support = hasTouchscreen ? "true" : "false";
    data.ram_size = (deviceMemory * 1024).toString();

    downloadFile(username + ".keyfile", JSON.stringify(data));
  }

  collectUserInfo();
})();
