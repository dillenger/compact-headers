var { ExtensionCommon } = ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs");
var { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");
var extension = ExtensionParent.GlobalManager.getExtension("compactHeaders@dillinger");

function stopContext(e) {
  e.preventDefault();
}

function getMessageWindow(nativeTab) {
  if (nativeTab instanceof Ci.nsIDOMWindow) {
    return nativeTab.messageBrowser.contentWindow;
  } else if (nativeTab.mode && nativeTab.mode.name == "mail3PaneTab") {
    return nativeTab.chromeBrowser.contentWindow.messageBrowser && nativeTab.chromeBrowser.contentWindow.messageBrowser.contentWindow;
  } else if (nativeTab.mode && nativeTab.mode.name == "mailMessageTab") {
    return nativeTab.chromeBrowser.contentWindow;
  } else {
    return null;
  }
}

function install(window) {
  let { document } = window;

  let msgHeaderView = document.getElementById("msgHeaderView");
  let messageHeader = document.getElementById("messageHeader");
  messageHeader.style.paddingTop = "3px";
  messageHeader.style.paddingRight = "3px";
  let messagepanebox = document.getElementById("messagepanebox");

  let headerViewToolbox = document.getElementById("header-view-toolbox");
  let headerViewToolbar = document.getElementById("header-view-toolbar");
  let otherActionsBox = document.getElementById("otherActionsBox");
  let compactHeadersPopup = document.createXULElement("menupopup");
  compactHeadersPopup.id = "compactHeadersPopup";
  msgHeaderView.setAttribute("context", "compactHeadersPopup");

  let compactHeadersSingleLine = document.createXULElement("menuitem");
  compactHeadersSingleLine.id = "compactHeadersSingleLine";
  compactHeadersSingleLine.setAttribute("type", "checkbox");
  compactHeadersSingleLine.setAttribute("label", extension.localizeMessage("singleLineLabel"));
  compactHeadersSingleLine.setAttribute("tooltiptext", extension.localizeMessage("singleLineTooltip"));
  compactHeadersSingleLine.addEventListener("command", () => setLines());

  let compactHeadersHideToolbar = document.createXULElement("menuitem");
  compactHeadersHideToolbar.id = "compactHeadersHideToolbar";
  compactHeadersHideToolbar.setAttribute("type", "checkbox");
  compactHeadersHideToolbar.setAttribute("label", extension.localizeMessage("hideToolbarLabel"));
  compactHeadersHideToolbar.setAttribute("tooltiptext", extension.localizeMessage("hideToolbarTooltip"));
  compactHeadersHideToolbar.addEventListener("command", () => toggleToolbar());

  let compactHeadersMoveToHeader = document.createXULElement("menuitem");
  compactHeadersMoveToHeader.id = "compactHeadersMoveToHeader";
  compactHeadersMoveToHeader.setAttribute("type", "checkbox");
  compactHeadersMoveToHeader.setAttribute("label", extension.localizeMessage("moveToHeaderLabel"));
  compactHeadersMoveToHeader.setAttribute("tooltiptext", extension.localizeMessage("moveToHeaderTooltip"));
  compactHeadersMoveToHeader.addEventListener("command", () => toggleToHeader());

  let compactHeadersMoveCcHeader = document.createXULElement("menuitem");
  compactHeadersMoveCcHeader.id = "compactHeadersMoveCcHeader";
  compactHeadersMoveCcHeader.setAttribute("type", "checkbox");
  compactHeadersMoveCcHeader.setAttribute("label", extension.localizeMessage("moveCcHeaderLabel"));
  compactHeadersMoveCcHeader.setAttribute("tooltiptext", extension.localizeMessage("moveCcHeaderTooltip"));
  compactHeadersMoveCcHeader.addEventListener("command", () => toggleCcHeader());

  let compactHeadersMoveContentBaseheader = document.createXULElement("menuitem");
  compactHeadersMoveContentBaseheader.id = "compactHeadersMoveContentBaseheader";
  compactHeadersMoveContentBaseheader.setAttribute("type", "checkbox");
  compactHeadersMoveContentBaseheader.setAttribute("label", extension.localizeMessage("moveContentBaseheaderLabel"));
  compactHeadersMoveContentBaseheader.setAttribute("tooltiptext", extension.localizeMessage("moveContentBaseheaderTooltip"));
  compactHeadersMoveContentBaseheader.addEventListener("command", () => toggleContentBaseHeader());

  let compactHeadersShowFullSubjectHeader = document.createXULElement("menuitem");
  compactHeadersShowFullSubjectHeader.id = "compactHeadersShowFullSubjectHeader";
  compactHeadersShowFullSubjectHeader.setAttribute("type", "checkbox");
  compactHeadersShowFullSubjectHeader.setAttribute("label", extension.localizeMessage("fullSubjectLabel"));
  compactHeadersShowFullSubjectHeader.setAttribute("tooltiptext", extension.localizeMessage("fullSubjectTooltip"));
  compactHeadersShowFullSubjectHeader.addEventListener("command", () => toggleFullSubjectHeader());

  let compactHeadersmovetags = document.createXULElement("menuitem");
  compactHeadersmovetags.id = "compactHeadersmovetags";
  compactHeadersmovetags.setAttribute("type", "checkbox");
  compactHeadersmovetags.setAttribute("label", extension.localizeMessage("moveTagsLabel"));
  compactHeadersmovetags.setAttribute("tooltiptext", extension.localizeMessage("moveTagsTooltip"));
  compactHeadersmovetags.addEventListener("command", () => toggleTags());

  try {
    let compactHeadersBox = document.getElementById("compactHeadersBox");
    if (compactHeadersBox) compactHeadersBox.remove();
  } catch (e) { }
  let compactHeadersBox = document.createXULElement("vbox");
  compactHeadersBox.id = "compactHeadersBox";
  compactHeadersBox.setAttribute("style", "margin-inline-start: -8px; position: relative; z-index: 1;");
  let compactHeadersButton = document.createXULElement("button");
  compactHeadersButton.id = "compactHeadersButton";
  compactHeadersButton.addEventListener("command", () => toggleHeaders());
  compactHeadersBox.append(compactHeadersButton);

  let compactHeadersLocale = window.navigator.language;
  if (compactHeadersLocale != "de") compactHeadersButton.setAttribute("accesskey", "D");
  compactHeadersButton.setAttribute("style", "background: transparent; margin: 0px -2px 0px 2px;\
    -moz-user-focus: ignore; border: 4px solid transparent; min-height: 0px; min-width: 0px;\
    padding: 0px !important; box-shadow: none; -moz-appearance: none;  fill: currentColor;");

  let compactHeadersSeparator = document.createXULElement("menuseparator");
  compactHeadersSeparator.id = "compactHeadersSeparator";

  let compactHeadersSeparator3 = document.createXULElement("menuseparator");
  compactHeadersSeparator3.id = "compactHeadersSeparator3";

  let compactHeadersSeparator4 = document.createXULElement("menuseparator");
  compactHeadersSeparator4.id = "compactHeadersSeparator4";

  let expandedfromRow = document.getElementById("expandedfromRow");
  expandedfromRow.setAttribute("style", "align-items: center; margin-block: -1em; padding-block: 1em; margin-inline: -2px auto; overflow: hidden; min-width: min-content;");
  expandedfromRow.insertAdjacentElement("afterbegin", compactHeadersBox);
  let expandedfromBox = document.getElementById("expandedfromBox");
  expandedfromBox.firstChild.nextSibling.style.flexWrap = "nowrap";
  expandedfromBox.firstChild.nextSibling.style.minWidth = "inherit";
  let expandedfromLabel = document.getElementById("expandedfromLabel");
  if (expandedfromLabel) expandedfromLabel.style.width = "4em";
  if (expandedfromLabel) expandedfromLabel.style.margin = "1px -2px";

  let expandedtoRow = document.getElementById("expandedtoRow");
  let expandedtoBox = document.getElementById("expandedtoBox");
  expandedtoBox.firstChild.nextSibling.style.minWidth = "inherit";
  let expandedtoLabel = document.getElementById("expandedtoLabel");

  let expandedccRow = document.getElementById("expandedccRow");
  let expandedccBox = document.getElementById("expandedccBox");
  expandedccBox.firstChild.nextSibling.style.minWidth = "inherit";
  let expandedccLabel = document.getElementById("expandedccLabel");

  let expandedcontentBaseRow = document.getElementById("expandedcontent-baseRow");
  let expandedcontentBaseBox = document.getElementById("expandedcontent-baseBox");
  if (expandedcontentBaseBox) expandedcontentBaseBox.addEventListener("contextmenu", stopContext, true);
  if (expandedcontentBaseBox) expandedcontentBaseBox.firstChild.nextSibling.style.minWidth = "inherit";
  let expandedcontentBaseLabel = document.getElementById("expandedcontent-baseLabel");

  let expandedsubjectRow = document.getElementById("expandedsubjectRow");
  if (expandedsubjectRow) expandedsubjectRow.setAttribute("style", "overflow: hidden; margin-block: -1px; z-index: 2;");

  let expandedsubjectBox = document.getElementById("expandedsubjectBox");
  if (expandedsubjectBox) expandedsubjectBox.addEventListener("contextmenu", stopContext, true);

  let expandedsubjectLabel = document.getElementById("expandedsubjectLabel");
  if (expandedsubjectLabel) expandedsubjectLabel.addEventListener("mouseover", () => setTooltip());
  if (expandedsubjectLabel) expandedsubjectLabel.style.marginBlock = "auto";

  let dateLabel = document.getElementById("dateLabel");
  if (dateLabel) dateLabel.setAttribute("style", "margin: auto 6px auto auto; min-width: fit-content; padding-inline-start: 1em;");
  if (dateLabel) dateLabel.addEventListener("contextmenu", stopContext, true);
  let dateLabelSubject = document.getElementById("dateLabelSubject");

  let expandedtagsBox = document.getElementById("expandedtagsBox");
  let expandedtagsRow = document.getElementById("expandedtagsRow");

  let encryptionTechBtn = document.getElementById("encryptionTechBtn");
  if (encryptionTechBtn) encryptionTechBtn.setAttribute("style", "margin-block: -4px; z-index: 3; padding-top: 0px !important; min-width: fit-content");

  let newsgroupsHeading = document.getElementById("newsgroupsHeading");
  if (newsgroupsHeading) newsgroupsHeading.setAttribute("style", "margin-block: auto;");

  let headerSenderToolbarContainer = document.getElementById("headerSenderToolbarContainer");
  if (headerSenderToolbarContainer) headerSenderToolbarContainer.style.display = "flex";
  if (headerSenderToolbarContainer) headerSenderToolbarContainer.style.flexDirection = "row-reverse";
  let headerSubjectSecurityContainer = document.getElementById("headerSubjectSecurityContainer");

  let headerHideLabels = document.getElementById("headerHideLabels");
  if (headerHideLabels) headerHideLabels.addEventListener("command", () => checkHiddenLabels());

  let expandedmessageIdBox = document.getElementById("expandedmessage-idBox");
  if (expandedmessageIdBox) expandedmessageIdBox.addEventListener("contextmenu", stopContext, true);

  let expandedlistIdBox = document.getElementById("expandedlist-idBox");
  if (expandedlistIdBox) expandedlistIdBox.addEventListener("contextmenu", stopContext, true);

  let expandedinReplyToBox = document.getElementById("expandedin-reply-toBox");
  if (expandedinReplyToBox) expandedinReplyToBox.addEventListener("contextmenu", stopContext, true);

  let expandedreferencesBox = document.getElementById("expandedreferencesBox");
  if (expandedreferencesBox) expandedreferencesBox.addEventListener("contextmenu", stopContext, true);

  let expandednewsgroupsBox = document.getElementById("expandednewsgroupsBox");
  if (expandednewsgroupsBox) expandednewsgroupsBox.addEventListener("contextmenu", stopContext, true);

  let singleMessage = document.getElementById("singleMessage");
  if (singleMessage) singleMessage.setAttribute("style", "background-color: buttonface !important");

  compactHeadersPopup.append(compactHeadersSingleLine);
  compactHeadersPopup.append(compactHeadersSeparator3);
  compactHeadersPopup.append(compactHeadersMoveToHeader);
  compactHeadersPopup.append(compactHeadersMoveCcHeader);
  compactHeadersPopup.append(compactHeadersMoveContentBaseheader);
  compactHeadersPopup.append(compactHeadersShowFullSubjectHeader);
  compactHeadersPopup.append(compactHeadersmovetags);
  compactHeadersPopup.append(compactHeadersSeparator4);
  compactHeadersPopup.append(compactHeadersHideToolbar);
  if (msgHeaderView.lastChild.id != "compactHeadersPopup") msgHeaderView.append(compactHeadersPopup);

  function patchRecipientClass() {
    window.customElements.whenDefined("header-recipient").then(classHeaderRecipient => {
      if (!classHeaderRecipient.prototype.originalUpdateRecipient) {
        classHeaderRecipient.prototype.originalUpdateRecipient = classHeaderRecipient.prototype.updateRecipient;
        classHeaderRecipient.prototype.updateRecipient = function() {
          this.originalUpdateRecipient();

          if (this.dataset.headerName == "to" || this.dataset.headerName == "cc") {
            this.nameLine.textContent = this.displayName;
            this.addressLine.textContent = this.emailAddress;
            if (this.displayName) {
              this.classList.add("has-display-name");
            } else {
              this.classList.remove("has-display-name");
            }
          }
        }
        // Call updateRecipient for existing recipients before patched
        for (let recipient of expandedtoBox.querySelectorAll('li[is="header-recipient"]')) {
          recipient.updateRecipient();
        }
        for (let recipient of expandedccBox.querySelectorAll('li[is="header-recipient"]')) {
          recipient.updateRecipient();
        }
      }
    });
  }

  function createStyle() {
    if (!document.getElementById("compactHeadersStyle")) {
      let style = document.createElement('style');
      style.id = "compactHeadersStyle";
      style.textContent = `
#messageHeader[compact="compact"].message-header-show-sender-full-address :is(#expandedtoLabel, #toHeading, #expandedccLabel, #ccHeading) {
  align-self: center;
}

#messageHeader[compact="compact"].message-header-show-sender-full-address .has-display-name .recipient-single-line {
  display: none;
}

#messageHeader[compact="compact"].message-header-show-sender-full-address .has-display-name .recipient-multi-line {
  display: inline-flex;
}
`;
      document.head.append(style);
    }
  }

  function singleLine() {
    headerViewToolbox.setAttribute("style", "display: none;");
    if (messageHeader.getAttribute("compact") == "compact") {
      headerSenderToolbarContainer.style.marginBottom = "unset";
      expandedfromRow.insertAdjacentElement("beforebegin", headerSubjectSecurityContainer);
      headerSubjectSecurityContainer.setAttribute("style", "height: 1.3em; z-index: 1; margin-block: -2em; margin-inline-start: -2em;\
        padding-block: 1em; padding-inline-start: 2em; background: linear-gradient(to right,transparent,buttonface 2em) !important;");
      expandedfromRow.style.flex = "1 0 auto";
      expandedtoRow.setAttribute("style", "display: none;");
      expandedccRow.setAttribute("style", "display: none;");
      expandedcontentBaseRow.setAttribute("style", "display: none;");
    } else {
      doubleLine();
    }
  }

  function doubleLine() {
    msgHeaderView.removeAttribute("style");
    headerViewToolbox.setAttribute("style", "display: flex; align-self: auto;");
    headerSenderToolbarContainer.insertAdjacentElement("afterend", headerSubjectSecurityContainer);
    headerSenderToolbarContainer.style.marginBottom = "-3px";
    expandedfromRow.style.flex = "inherit";
    expandedtoRow.removeAttribute("style");
    expandedccRow.removeAttribute("style");
    expandedcontentBaseRow.removeAttribute("style");
  }

  function setLines() {
    if (messageHeader.getAttribute("singleline") == "singleline") {
      messageHeader.setAttribute("singleline", "");
      doubleLine();
      checkHeaders();
    } else {
      messageHeader.setAttribute("singleline", "singleline");
      checkHeaders();
      singleLine();
    }
    moveExpandedtagsBox();
  }

  function checkLines() {
    if (messageHeader.getAttribute("singleline") == "singleline") {
      compactHeadersSingleLine.setAttribute("checked", true);
      singleLine();
    } else {
      compactHeadersSingleLine.setAttribute("checked", false);
      doubleLine();
    }
  }

  function toggleToolbar() {
    if (messageHeader.getAttribute("hidetoolbar") == "hidetoolbar") {
      messageHeader.removeAttribute("hidetoolbar");
    } else {
      messageHeader.setAttribute("hidetoolbar", "hidetoolbar");
    }
    checkToolbar();
  }

  function markToolbar() {
    if (messageHeader.getAttribute("hidetoolbar") == "hidetoolbar") {
      compactHeadersHideToolbar.setAttribute("checked", true);
    } else {
      compactHeadersHideToolbar.setAttribute("checked", false);
    }
  }

  function checkHeaders() {
    messageHeader.setAttribute("persist", "compact; singleline; hidetoolbar; hideheaders; movetoheader; moveccheader; movecontentbaseheader; movetags");
    headerSubjectSecurityContainer.removeAttribute("hidden");

    if (messageHeader.getAttribute("compact") == "compact") setCompactHeaders();
    else setDefaultHeaders();

    setDateLabelSubject();
    checkToolbar();
    moveExpandedtagsBox();
    checkHiddenLabels();
  }

  function setCompactHeaders() {
    messageHeader.style.overflow = "hidden";
    headerSenderToolbarContainer.style.flexWrap = "unset";
    headerSenderToolbarContainer.style.alignItems = "center";
    if (messageHeader.getAttribute("singleline") == "singleline") messageHeader.style.paddingBottom = "3px";
    else messageHeader.style.paddingBottom = "6px";
    compactHeadersButton.setAttribute("class", "button button-flat");
    compactHeadersButton.image = "chrome://messenger/skin/overrides/arrow-right-12.svg";
    compactHeadersBox.setAttribute("style", "margin-inline-start: -8px; position: relative; z-index: 1;");
    compactHeadersButton.setAttribute("tooltiptext", extension.localizeMessage("showDetails"));
    var i;
    for (i = 1; i < messageHeader.childElementCount; i++) {
      messageHeader.children[i].setAttribute("persist", "style");
      messageHeader.children[i].setAttribute("style", "display: none;");
      if (messageHeader.getAttribute("singleline") != "singleline") headerSubjectSecurityContainer.setAttribute("style", "height: unset; z-index: 3;");
    }
    if (expandedsubjectBox) expandedsubjectBox.setAttribute("style", "overflow: hidden; -webkit-line-clamp: 1; min-width: 8em; max-width: fit-content; word-break: break-all;");
    if ((messageHeader.getAttribute("showfullsubjectheader") == "showfullsubjectheader") && (messageHeader.getAttribute("singleline") != "singleline"))
      expandedsubjectBox.setAttribute("style", "overflow: hidden; -webkit-line-clamp: 3; min-width: 8em; max-width: fit-content; word-break: normal;");
    if (messageHeader.getAttribute("singleline") == "singleline") singleLine();
    else doubleLine();

    expandedfromBox.setAttribute("style", "margin-block: auto; overflow: hidden; min-width: 250%; margin-inline-end: auto; padding-inline-start: 2px; z-index: auto;");

    headerViewToolbox.style.flex = "auto";
    headerViewToolbox.style.alignSelf = "auto";

    expandedfromRow.insertAdjacentElement("beforebegin", expandedcontentBaseRow);
    expandedcontentBaseRow.setAttribute("style", "background: linear-gradient(to right,transparent,buttonface 2em) !important;\
      margin-block: -1em; padding-block: 1em; margin-inline-start: -2em; padding-inline-start: 2.4em; z-index: 2; flex: inherit;");
    expandedcontentBaseBox.setAttribute("style", "min-height:18px; overflow: hidden; min-width: 250%; margin-inline-end: -99em;");
    expandedfromRow.insertAdjacentElement("beforebegin", expandedccRow);
    expandedccRow.setAttribute("style", "background: linear-gradient(to right,transparent,buttonface 2em) !important;\
      margin-block: -1em; padding-block: 1em; margin-inline-start: -2em; padding-inline-start: 2.4em; z-index: 2; flex: inherit;");
    expandedccBox.setAttribute("style", "min-height:20px; overflow: hidden; min-width: 250%; margin-inline-end: auto;");
    expandedfromRow.insertAdjacentElement("beforebegin", expandedtoRow);
    expandedtoRow.setAttribute("style", "background: linear-gradient(to right,transparent,buttonface 2em) !important;\
      margin-block: -1em; padding-block: 1em; margin-inline-start: -2em; padding-inline-start: 2.4em; z-index: 1; flex: inherit;");
    expandedtoBox.setAttribute("style", "min-height:20px; overflow: hidden; min-width: 250%; margin-inline-end: auto;");

    if ((messageHeader.getAttribute("movecontentbaseheader") != "movecontentbaseheader") || (messageHeader.getAttribute("singleline") == "singleline")) {
      expandedcontentBaseRow.style.display = "none";
    }
    if ((messageHeader.getAttribute("moveccheader") != "moveccheader") || (messageHeader.getAttribute("singleline") == "singleline")) {
      expandedccRow.style.display = "none";
    }
    if ((messageHeader.getAttribute("movetoheader") != "movetoheader") || (messageHeader.getAttribute("singleline") == "singleline")) {
      expandedtoRow.style.display = "none";
    }
  }

  function setDefaultHeaders() {
    messageHeader.style.overflowX = "hidden";
    messageHeader.style.overflowY = "auto";
    headerSenderToolbarContainer.style.flexWrap = "wrap";
    headerSenderToolbarContainer.style.alignItems = "center";
    messageHeader.style.paddingBottom = "0px";
    compactHeadersButton.setAttribute("class", "button button-flat");
    compactHeadersButton.image = "chrome://messenger/skin/overrides/arrow-down-12.svg";
    compactHeadersBox.setAttribute("style", "margin-inline-start: -8px; position: relative; z-index: 1;");
    compactHeadersButton.setAttribute("tooltiptext", extension.localizeMessage("hideDetails"));
    var i;
    for (i = 1; i < messageHeader.childElementCount; i++) {
      messageHeader.children[i].setAttribute("persist", "style");
      messageHeader.children[i].removeAttribute("style");
      headerSubjectSecurityContainer.setAttribute("style", "height: unset; z-index: 3;");
    }
    if (expandedsubjectBox) expandedsubjectBox.setAttribute("style", "overflow-x: hidden; -webkit-line-clamp: 3; min-width: 8em; max-width: fit-content; word-break: normal;");
    doubleLine();

    expandedfromBox.setAttribute("style", "margin-block: auto; overflow: hidden; min-width: 250%; margin-inline-end: auto; padding-inline-start: 2px; z-index: 3;");

    headerSubjectSecurityContainer.insertAdjacentElement("afterend", expandedcontentBaseRow);
    expandedcontentBaseRow.removeAttribute("style");
    expandedcontentBaseBox.removeAttribute("style");
    headerSubjectSecurityContainer.insertAdjacentElement("afterend", expandedccRow);
    expandedccRow.removeAttribute("style");
    expandedccBox.removeAttribute("style");
    headerSubjectSecurityContainer.insertAdjacentElement("afterend", expandedtoRow);
    expandedtoRow.removeAttribute("style");
    expandedtoBox.removeAttribute("style");
  }

  function setDateLabelSubject() {
    expandedsubjectBox.insertAdjacentElement("afterend", dateLabel);
    dateLabelSubject.setAttribute("style", "display: none;");
  }

  function toggleHeaders() {
    switch (messageHeader.getAttribute("compact")) {
      case "compact": messageHeader.removeAttribute("compact");
        break;
      default: messageHeader.setAttribute("compact", "compact");
    }
    window.ReloadMessage();
    checkHeaders();
  }

  function checkToolbar() {
    if (messageHeader.getAttribute("hidetoolbar") == "hidetoolbar") {
      hideToolbar();
    } else {
      showToolbar();
    }
  }

  function hideToolbar() {
    headerViewToolbar.setAttribute("style", "display: none;");
  }

  function showToolbar() {
    headerViewToolbar.setAttribute("style", "margin: -6px -1em -5px -2em; padding: 9px 1em 10px 2.2em; position: relative; z-index: 3;\
      background: linear-gradient(to right,transparent,buttonface 2em) !important; min-width: max-content; min-height: 1.8em;");
  }

  function toggleToHeader() {
    if (messageHeader.getAttribute("movetoheader") == "movetoheader") {
      messageHeader.removeAttribute("movetoheader");
    } else {
      messageHeader.setAttribute("movetoheader", "movetoheader");
    }
    checkHeaders();
  }

  function toggleCcHeader() {
    if (messageHeader.getAttribute("moveccheader") == "moveccheader") {
      messageHeader.removeAttribute("moveccheader");
    } else {
      messageHeader.setAttribute("moveccheader", "moveccheader");
    }
    checkHeaders();
  }

  function toggleContentBaseHeader() {
    if (messageHeader.getAttribute("movecontentbaseheader") == "movecontentbaseheader") {
      messageHeader.removeAttribute("movecontentbaseheader");
    } else {
      messageHeader.setAttribute("movecontentbaseheader", "movecontentbaseheader");
    }
    checkHeaders();
  }

  function toggleFullSubjectHeader() {
    if (messageHeader.getAttribute("showfullsubjectheader") == "showfullsubjectheader") {
      messageHeader.removeAttribute("showfullsubjectheader");
    } else {
      messageHeader.setAttribute("showfullsubjectheader", "showfullsubjectheader");
    }
    checkHeaders();
  }

  function toggleTags() {
    if (messageHeader.getAttribute("movetags") == "movetags") {
      messageHeader.removeAttribute("movetags");
    } else {
      messageHeader.setAttribute("movetags", "movetags");
    }
    checkHeaders();
  }

  function checkToCcHeaders() {
    if (messageHeader.getAttribute("movetoheader") == "movetoheader") {
      compactHeadersMoveToHeader.setAttribute("checked", true);
    } else {
      compactHeadersMoveToHeader.setAttribute("checked", false);
    }
    if (messageHeader.getAttribute("moveccheader") == "moveccheader") {
      compactHeadersMoveCcHeader.setAttribute("checked", true);
    } else {
      compactHeadersMoveCcHeader.setAttribute("checked", false);
    }
    if (messageHeader.getAttribute("movecontentbaseheader") == "movecontentbaseheader") {
      compactHeadersMoveContentBaseheader.setAttribute("checked", true);
    } else {
      compactHeadersMoveContentBaseheader.setAttribute("checked", false);
    }
    if (messageHeader.getAttribute("showfullsubjectheader") == "showfullsubjectheader") {
      compactHeadersShowFullSubjectHeader.setAttribute("checked", true);
    } else {
      compactHeadersShowFullSubjectHeader.setAttribute("checked", false);
    }
    if (messageHeader.getAttribute("movetags") == "movetags") {
      compactHeadersmovetags.setAttribute("checked", true);
    } else {
      compactHeadersmovetags.setAttribute("checked", false);
    }
  }

  function setTooltip() {
    if (expandedsubjectLabel) expandedsubjectLabel.setAttribute("tooltiptext", expandedsubjectBox.lastChild.textContent);
  }

  function checkHiddenLabels() {
    if ((expandedfromLabel.style.minWidth == "0px") || (expandedfromLabel.style.minWidth == "")) {
      expandedfromRow.style.marginLeft = "-2px";
      if ((messageHeader.getAttribute("compact") == "compact") && (messageHeader.getAttribute("singleline") == "singleline")) {
        expandedsubjectRow.style.paddingLeft = "1.2em";
      } else {
        expandedsubjectRow.style.paddingLeft = "0px";
      }
    } else {
      expandedfromRow.style.marginLeft = "4px";
      expandedsubjectRow.style.paddingLeft = "0px";
    }
  }

  function moveExpandedtagsBox() {
    if ((messageHeader.getAttribute("compact") == "compact") &&
      (messageHeader.getAttribute("singleline") != "singleline") &&
      (messageHeader.getAttribute("movetags") == "movetags")) {
      dateLabel.insertAdjacentElement("beforebegin", expandedtagsBox);
      dateLabel.style.marginLeft = "0px";
      expandedtagsBox.style.marginLeft = "auto";
      expandedtagsBox.style.paddingLeft = "8px";
      expandedtagsBox.style.minWidth = "fit-content";
    } else if ((messageHeader.getAttribute("compact") != "compact") ||
      (messageHeader.getAttribute("singleline") == "singleline") ||
      (messageHeader.getAttribute("movetags") != "movetags")) {
      expandedtagsRow.insertAdjacentElement("beforeend", expandedtagsBox);
      dateLabel.style.marginLeft = "auto";
      expandedtagsBox.style.marginLeft = "unset";
      expandedtagsBox.style.paddingLeft = "0px";
      expandedtagsBox.style.minWidth = "unset";
    }
  }

  function checkOthers() {
    if (messageHeader.getAttribute("compact") == "compact") {
      expandedtoLabel.style.minWidth = "fit-content";
      expandedccLabel.style.minWidth = "fit-content";
      expandedcontentBaseLabel.style.minWidth = "fit-content";
    }
    if (messageHeader.getAttribute("compact") == "compact") {
      try {
        expandedccBox.firstChild.nextSibling.lastChild.firstChild.addEventListener("click", expandHeaders, { once: true });
      } catch (e) { };
    }
    if (messageHeader.getAttribute("compact") == "compact") {
      try {
        expandedtoBox.firstChild.nextSibling.lastChild.firstChild.addEventListener("click", expandHeaders, { once: true });
      } catch (e) { };
    }
  }

  function expandHeaders() {
    messageHeader.removeAttribute("compact");
    checkHeaders();
  }

  patchRecipientClass();
  createStyle();
  checkLines();
  markToolbar();
  checkToCcHeaders();
  checkOthers();
  checkHeaders();
}

function uninstall(window) {
  let { document } = window;

  let msgHeaderView = document.getElementById("msgHeaderView");
  if (msgHeaderView) msgHeaderView.removeAttribute("style");

  let messageHeader = document.getElementById("messageHeader");
  if (messageHeader) {
    var i;
    for (i = 1; i < messageHeader.childElementCount; i++) {
      messageHeader.children[i].setAttribute("persist", "style");
      messageHeader.children[i].removeAttribute("style");
    }
    messageHeader.removeAttribute("compact");
    messageHeader.removeAttribute("style");
  }

  let headerViewToolbar = document.getElementById("header-view-toolbar");
  if (headerViewToolbar) headerViewToolbar.removeAttribute("style");

  let expandedfromRow = document.getElementById("expandedfromRow");
  if (expandedfromRow) expandedfromRow.style.marginLeft = "0px";
  if (expandedfromRow) expandedfromRow.style.flex = "inherit";
  if (expandedfromRow) expandedfromRow.removeAttribute("style");

  let expandedfromLabel = document.getElementById("expandedfromLabel");
  if (expandedfromLabel) expandedfromLabel.removeAttribute("style");

  let expandedfromBox = document.getElementById("expandedfromBox");
  if (expandedfromBox) expandedfromBox.removeAttribute("style");

  let headerViewToolbox = document.getElementById("header-view-toolbox");
  if (headerViewToolbox) headerViewToolbox.removeAttribute("style");

  let expandedsubjectRow = document.getElementById("expandedsubjectRow");
  if (expandedsubjectRow) expandedsubjectRow.style.paddingLeft = "0px";
  if (expandedsubjectRow) expandedsubjectRow.removeAttribute("style");

  let expandedsubjectBox = document.getElementById("expandedsubjectBox");
  if (expandedsubjectBox) expandedsubjectBox.removeAttribute("style");
  if (expandedsubjectBox) expandedsubjectBox.removeEventListener("contextmenu", stopContext, true);

  let expandedcontentBaseBox = document.getElementById("expandedcontent-baseBox");
  if (expandedcontentBaseBox) expandedcontentBaseBox.removeEventListener("contextmenu", stopContext, true);

  let expandedmessageIdBox = document.getElementById("expandedmessage-idBox");
  if (expandedmessageIdBox) expandedmessageIdBox.removeEventListener("contextmenu", stopContext, true);

  let expandedlistIdBox = document.getElementById("expandedlist-idBox");
  if (expandedlistIdBox) expandedlistIdBox.removeEventListener("contextmenu", stopContext, true);

  let expandednewsgroupsBox = document.getElementById("expandednewsgroupsBox");
  if (expandednewsgroupsBox) expandednewsgroupsBox.removeEventListener("contextmenu", stopContext, true);

  let expandedinReplyToBox = document.getElementById("expandedin-reply-toBox");
  if (expandedinReplyToBox) expandedinReplyToBox.removeEventListener("contextmenu", stopContext, true);

  let expandedreferencesBox = document.getElementById("expandedreferencesBox");
  if (expandedreferencesBox) expandedreferencesBox.removeEventListener("contextmenu", stopContext, true);

  let compactHeadersPopup = document.getElementById("compactHeadersPopup");
  if (compactHeadersPopup) compactHeadersPopup.remove();
  let compactHeadersButton = document.getElementById("compactHeadersButton");
  if (compactHeadersButton) compactHeadersButton.remove();
  let compactHeadersBox = document.getElementById("compactHeadersBox");
  if (compactHeadersBox) compactHeadersBox.remove();

  let expandedtoRow = document.getElementById("expandedtoRow");
  if (expandedtoRow) expandedtoRow.removeAttribute("style");
  let expandedccRow = document.getElementById("expandedccRow");
  if (expandedccRow) expandedccRow.removeAttribute("style");
  let expandedcontentBaseRow = document.getElementById("expandedcontent-baseRow");
  if (expandedcontentBaseRow) expandedcontentBaseRow.removeAttribute("style");
  let expandednewsgroupsRow = document.getElementById("expandednewsgroupsRow");

  let headerSubjectSecurityContainer = document.getElementById("headerSubjectSecurityContainer");
  let headerSenderToolbarContainer = document.getElementById("headerSenderToolbarContainer");
  if (headerSenderToolbarContainer) headerSenderToolbarContainer.insertAdjacentElement("afterend", headerSubjectSecurityContainer);
  if (expandedtoRow) headerSubjectSecurityContainer.insertAdjacentElement("beforebegin", expandedtoRow);
  if (expandedccRow) headerSubjectSecurityContainer.insertAdjacentElement("beforebegin", expandedccRow);
  if (expandednewsgroupsRow) headerSubjectSecurityContainer.insertAdjacentElement("beforebegin", expandednewsgroupsRow);
  if (expandedcontentBaseRow) headerSubjectSecurityContainer.insertAdjacentElement("beforebegin", expandedcontentBaseRow);
  if (headerSubjectSecurityContainer) headerSubjectSecurityContainer.removeAttribute("style");
  if (headerSenderToolbarContainer) headerSenderToolbarContainer.removeAttribute("style");

  let expandedccBox = document.getElementById("expandedccBox");
  if (expandedccBox) expandedccBox.removeAttribute("style");

  let expandedtoLabel = document.getElementById("expandedtoLabel");
  if (expandedtoLabel) expandedtoLabel.removeAttribute("style");
  let expandedccLabel = document.getElementById("expandedccLabel");
  if (expandedccLabel) expandedccLabel.removeAttribute("style");
  let expandedcontentBaseLabel = document.getElementById("expandedcontent-baseLabel");
  if (expandedcontentBaseLabel) expandedcontentBaseLabel.removeAttribute("style");

  let dateLabel = document.getElementById("dateLabel");
  let expandedtoBox = document.getElementById("expandedtoBox");
  if (expandedtoBox) expandedtoBox.insertAdjacentElement("afterend", dateLabel);
  if (expandedtoBox) expandedtoBox.removeAttribute("style");

  if (dateLabel) dateLabel.removeAttribute("style");
  if (dateLabel) dateLabel.removeEventListener("contextmenu", stopContext, true);

  let dateLabelSubject = document.getElementById("dateLabelSubject");
  if (dateLabelSubject) dateLabelSubject.removeAttribute("style");

  let encryptionTechBtn = document.getElementById("encryptionTechBtn");
  if (encryptionTechBtn) encryptionTechBtn.removeAttribute("style");

  let singleMessage = document.getElementById("singleMessage");
  if (singleMessage) singleMessage.removeAttribute("style");

  let expandedtagsBox = document.getElementById("expandedtagsBox");
  let expandedtagsRow = document.getElementById("expandedtagsRow");
  if (expandedtagsRow) expandedtagsRow.insertAdjacentElement("afterbegin", expandedtagsBox);
  if (expandedtagsBox) expandedtagsBox.removeAttribute("style");

  let compactHeadersStyle = document.getElementById("compactHeadersStyle");
  if (compactHeadersStyle) document.head.removeChild(compactHeadersStyle);

  window.customElements.whenDefined("header-recipient").then(classHeaderRecipient => {
    if (classHeaderRecipient.prototype.originalUpdateRecipient) {
      classHeaderRecipient.prototype.updateRecipient = classHeaderRecipient.prototype.originalUpdateRecipient;
      delete classHeaderRecipient.prototype.originalUpdateRecipient;
    }
  });
}

var compactHeadersApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      compactHeadersApi: {
        async compactHeaders(tabId) {
          let { nativeTab } = context.extension.tabManager.get(tabId);
          let messageBrowserWindow = getMessageWindow(nativeTab);
          if (messageBrowserWindow) {
            // Load into the freshly opened messageBrowser window.
            try {
              install(messageBrowserWindow);
            } catch (e) {}
          }
        },
      },
    };
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      // Always show rss summary on startup to work around bug 1871733.
      //Services.prefs.setIntPref("rss.show.summary", 1);
      return;
    }

    // Uninstall from any messageBrowser in any tab in any mail:3pane window.
    for (let window of Services.wm.getEnumerator("mail:3pane")) {
      for (let nativeTab of window.gTabmail.tabInfo) {
        let messageBrowserWindow = getMessageWindow(nativeTab);
        if (messageBrowserWindow) {
          uninstall(messageBrowserWindow);
        }
      }
    }

    // Uninstall from messageBrowser window in all mail:messageWindow windows.
    for (let window of Services.wm.getEnumerator("mail:messageWindow")) {
      let messageBrowserWindow = getMessageWindow(window);
      if (messageBrowserWindow) {
        uninstall(messageBrowserWindow);
      }
    }
  }
};
