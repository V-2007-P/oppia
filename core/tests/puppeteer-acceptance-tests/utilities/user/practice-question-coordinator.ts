// Copyright 2025 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Practice Question Coordinator role utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import {showMessage} from '../common/show-message';

const questionRoleEditorModalSelector =
  '.e2e-test-question-role-editor-container';
const checkedCheckboxSelector = '.e2e-test-checkbox-checked';
const uncheckedCheckboxSelector = '.e2e-test-checkbox-unchecked';
const saveButtonSelector = '.e2e-test-save-button';

const totalQuestionReviewersSelector = '.e2e-test-total-question-reviewers';

interface ElementRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface ComputedStyles {
  position: string;
  top: string;
  transform: string;
  overflow: string;
  margin: string;
}

interface DiagnosticMetrics {
  scrollY: number;
  scrollingElementTop: number;
  documentElementTop: number;
  bodyTop: number;
  bodyClassName: string;
  bodyInlineStyle: string | null;
  bodyComputed: ComputedStyles;
  docElComputed: ComputedStyles;
  tabsRect: ElementRect | null;
  addBtnRect: ElementRect | null;
  modalRect: ElementRect | null;
}

export class QuestionCoordinator extends BaseUser {
  /**
   * Clicks on the add reviewer or submitter button.
   * @param {'Submitter' | 'Reviewer'} right - The right to add.
   * @param {'add' | 'remove'} action - The action to perform.
   */
  async addOrRemoveQuestionRightsInQuestionRoleEditorModal(
    right: 'Submitter' | 'Reviewer',
    action: 'add' | 'remove' = 'add'
  ): Promise<void> {
    // Get some required selectors.
    const roleCheckboxSelector = `.e2e-test-question-${right.toLowerCase()}-checkbox`;

    const initialCheckboxStateSelector =
      action === 'add'
        ? `${roleCheckboxSelector}${uncheckedCheckboxSelector}`
        : `${roleCheckboxSelector}${checkedCheckboxSelector}`;
    const requiredCheckboxStateSelector =
      action === 'add'
        ? `${roleCheckboxSelector}${checkedCheckboxSelector}`
        : `${roleCheckboxSelector}${uncheckedCheckboxSelector}`;

    // Get Question Role Editor Modal.
    const questionRoleEditorModal = await this.getElementInParent(
      questionRoleEditorModalSelector
    );

    const checkboxElement = await questionRoleEditorModal.$(
      initialCheckboxStateSelector
    );

    if (!checkboxElement) {
      throw new Error(
        `Could not find unchecked role checkbox for ${right} role.`
      );
    }

    await checkboxElement.click();

    await this.expectElementToBeVisible(requiredCheckboxStateSelector);
  }

  /**
   * Checks if the question role editor modal is visible.
   */
  async expectQuestionRoleEditorModalToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(questionRoleEditorModalSelector);
    await this.waitForElementToStabilize(questionRoleEditorModalSelector);
    if (this.isViewportAtMobileWidth()) {
      // Capture diagnostic state before normalization.
      const before = await this.page.evaluate((): DiagnosticMetrics => {
        const body = document.body;
        const docEl = document.documentElement;
        const bodyStyle = window.getComputedStyle(body);
        const docElStyle = window.getComputedStyle(docEl);
        const tabs =
          document.querySelector('.e2e-test-tab-selection-dropdown') ||
          document.querySelector(
            '.oppia-contributor-dashboard-admin-page-tabs-container'
          );
        const addBtn = document.querySelector(
          '.e2e-test-add-contributor-button'
        );
        const modal = document.querySelector(
          '.e2e-test-question-role-editor-container'
        );

        return {
          scrollY: window.scrollY,
          scrollingElementTop:
            document.scrollingElement !== null
              ? document.scrollingElement.scrollTop
              : 0,
          documentElementTop: docEl.scrollTop,
          bodyTop: body.scrollTop,
          bodyClassName: body.className,
          bodyInlineStyle: body.getAttribute('style'),
          bodyComputed: {
            position: bodyStyle.position,
            top: bodyStyle.top,
            transform: bodyStyle.transform,
            overflow: bodyStyle.overflow,
            margin: bodyStyle.margin,
          },
          docElComputed: {
            position: docElStyle.position,
            top: docElStyle.top,
            transform: docElStyle.transform,
            overflow: docElStyle.overflow,
            margin: docElStyle.margin,
          },
          tabsRect:
            tabs !== null
              ? {
                  top: tabs.getBoundingClientRect().top,
                  bottom: tabs.getBoundingClientRect().bottom,
                  left: tabs.getBoundingClientRect().left,
                  right: tabs.getBoundingClientRect().right,
                }
              : null,
          addBtnRect:
            addBtn !== null
              ? {
                  top: addBtn.getBoundingClientRect().top,
                  bottom: addBtn.getBoundingClientRect().bottom,
                  left: addBtn.getBoundingClientRect().left,
                  right: addBtn.getBoundingClientRect().right,
                }
              : null,
          modalRect:
            modal !== null
              ? {
                  top: modal.getBoundingClientRect().top,
                  bottom: modal.getBoundingClientRect().bottom,
                  left: modal.getBoundingClientRect().left,
                  right: modal.getBoundingClientRect().right,
                }
              : null,
        };
      });

      showMessage(
        `[MobileScrollNormalization] Before: scrollY=${before.scrollY}, ` +
          `scrollingElementTop=${before.scrollingElementTop}, ` +
          `body.class="${before.bodyClassName}", ` +
          `body.style="${before.bodyInlineStyle ?? 'none'}", ` +
          `body.computed={pos:${before.bodyComputed.position},top:${before.bodyComputed.top},transform:${before.bodyComputed.transform},overflow:${before.bodyComputed.overflow},margin:${before.bodyComputed.margin}}, ` +
          `docEl.computed={pos:${before.docElComputed.position},top:${before.docElComputed.top},transform:${before.docElComputed.transform},overflow:${before.docElComputed.overflow},margin:${before.docElComputed.margin}}, ` +
          `tabsRect=${JSON.stringify(before.tabsRect)}, ` +
          `addBtnRect=${JSON.stringify(before.addBtnRect)}, ` +
          `modalRect=${JSON.stringify(before.modalRect)}`
      );

      // Normalize mobile page scroll to top so that background elements
      // visible behind the modal backdrop are deterministically positioned.
      const after = await this.page.evaluate(
        async (): Promise<DiagnosticMetrics> => {
          window.scrollTo(0, 0);
          if (document.scrollingElement) {
            document.scrollingElement.scrollTop = 0;
          }
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;

          // Verify that the scroll position remains stable across animation frames.
          await new Promise<void>(resolve => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });

          const body = document.body;
          const docEl = document.documentElement;
          const bodyStyle = window.getComputedStyle(body);
          const docElStyle = window.getComputedStyle(docEl);
          const tabs =
            document.querySelector('.e2e-test-tab-selection-dropdown') ||
            document.querySelector(
              '.oppia-contributor-dashboard-admin-page-tabs-container'
            );
          const addBtn = document.querySelector(
            '.e2e-test-add-contributor-button'
          );
          const modal = document.querySelector(
            '.e2e-test-question-role-editor-container'
          );

          return {
            scrollY: window.scrollY,
            scrollingElementTop:
              document.scrollingElement !== null
                ? document.scrollingElement.scrollTop
                : 0,
            documentElementTop: docEl.scrollTop,
            bodyTop: body.scrollTop,
            bodyClassName: body.className,
            bodyInlineStyle: body.getAttribute('style'),
            bodyComputed: {
              position: bodyStyle.position,
              top: bodyStyle.top,
              transform: bodyStyle.transform,
              overflow: bodyStyle.overflow,
              margin: bodyStyle.margin,
            },
            docElComputed: {
              position: docElStyle.position,
              top: docElStyle.top,
              transform: docElStyle.transform,
              overflow: docElStyle.overflow,
              margin: docElStyle.margin,
            },
            tabsRect:
              tabs !== null
                ? {
                    top: tabs.getBoundingClientRect().top,
                    bottom: tabs.getBoundingClientRect().bottom,
                    left: tabs.getBoundingClientRect().left,
                    right: tabs.getBoundingClientRect().right,
                  }
                : null,
            addBtnRect:
              addBtn !== null
                ? {
                    top: addBtn.getBoundingClientRect().top,
                    bottom: addBtn.getBoundingClientRect().bottom,
                    left: addBtn.getBoundingClientRect().left,
                    right: addBtn.getBoundingClientRect().right,
                  }
                : null,
            modalRect:
              modal !== null
                ? {
                    top: modal.getBoundingClientRect().top,
                    bottom: modal.getBoundingClientRect().bottom,
                    left: modal.getBoundingClientRect().left,
                    right: modal.getBoundingClientRect().right,
                  }
                : null,
          };
        }
      );

      showMessage(
        `[MobileScrollNormalization] After: scrollY=${after.scrollY}, ` +
          `scrollingElementTop=${after.scrollingElementTop}, ` +
          `body.class="${after.bodyClassName}", ` +
          `body.style="${after.bodyInlineStyle ?? 'none'}", ` +
          `body.computed={pos:${after.bodyComputed.position},top:${after.bodyComputed.top},transform:${after.bodyComputed.transform},overflow:${after.bodyComputed.overflow},margin:${after.bodyComputed.margin}}, ` +
          `docEl.computed={pos:${after.docElComputed.position},top:${after.docElComputed.top},transform:${after.docElComputed.transform},overflow:${after.docElComputed.overflow},margin:${after.docElComputed.margin}}, ` +
          `tabsRect=${JSON.stringify(after.tabsRect)}, ` +
          `addBtnRect=${JSON.stringify(after.addBtnRect)}, ` +
          `modalRect=${JSON.stringify(after.modalRect)}`
      );

      // Verify that scroll normalization reset all scroll offsets to zero.
      if (
        after.scrollY !== 0 ||
        after.scrollingElementTop !== 0 ||
        after.documentElementTop !== 0 ||
        after.bodyTop !== 0
      ) {
        throw new Error(
          'Mobile scroll normalization failed. Expected scroll offset 0, ' +
            `but received: window.scrollY=${after.scrollY}, ` +
            `document.scrollingElement.scrollTop=${after.scrollingElementTop}, ` +
            `document.documentElement.scrollTop=${after.documentElementTop}, ` +
            `document.body.scrollTop=${after.bodyTop}, ` +
            `body.class="${after.bodyClassName}", ` +
            `body.style="${after.bodyInlineStyle ?? 'none'}", ` +
            `body.computed.top=${after.bodyComputed.top}, ` +
            `body.computed.transform=${after.bodyComputed.transform}.`
        );
      }

      // Verify measured geometry against document position (docTop = rect.top + scrollY).
      if (before.addBtnRect !== null && after.addBtnRect !== null) {
        const expectedAddBtnTop = before.addBtnRect.top + before.scrollY;
        if (Math.abs(after.addBtnRect.top - expectedAddBtnTop) > 1) {
          throw new Error(
            'Add Reviewer button geometry mismatch after normalization. ' +
              `Expected top=${expectedAddBtnTop} (measured docTop), ` +
              `but received top=${after.addBtnRect.top} ` +
              `(before.top=${before.addBtnRect.top}, before.scrollY=${before.scrollY}).`
          );
        }
      }

      if (before.tabsRect !== null && after.tabsRect !== null) {
        const expectedTabsTop = before.tabsRect.top + before.scrollY;
        if (Math.abs(after.tabsRect.top - expectedTabsTop) > 1) {
          throw new Error(
            'Dashboard tabs geometry mismatch after normalization. ' +
              `Expected top=${expectedTabsTop} (measured docTop), ` +
              `but received top=${after.tabsRect.top} ` +
              `(before.top=${before.tabsRect.top}, before.scrollY=${before.scrollY}).`
          );
        }
      }

      // Store post-normalization baseline for pre-screenshot verification.
      this.mobilePostNormalizationMetrics = {
        scrollY: after.scrollY,
        scrollingElementTop: after.scrollingElementTop,
        documentElementTop: after.documentElementTop,
        bodyTop: after.bodyTop,
        tabsTop: after.tabsRect !== null ? after.tabsRect.top : null,
        addBtnTop: after.addBtnRect !== null ? after.addBtnRect.top : null,
        modalTop: after.modalRect !== null ? after.modalRect.top : null,
      };
    }
  }

  /**
   * Saves and closes the question role editor modal.
   */
  async saveAndCloseQuestionRoleEditorModal(): Promise<void> {
    const questionRoleEditorModal = await this.getElementInParent(
      questionRoleEditorModalSelector
    );

    const saveButton = await questionRoleEditorModal.$(saveButtonSelector);

    if (!saveButton) {
      throw new Error(
        'Could not find save button in question role editor modal.'
      );
    }

    await saveButton.click();

    await this.expectElementToBeVisible(questionRoleEditorModalSelector, false);
    await this.page.waitForFunction(
      () =>
        document.querySelectorAll('.modal-backdrop, ngb-modal-window, .modal')
          .length === 0
    );
  }

  /**
   * Checks if the total number of question reviewers is as expected.
   * @param {number} number - The expected number of question reviewers.
   */
  async expectTotalQuestionReviewersToBe(number: number): Promise<void> {
    await this.expectTextContentToBe(
      totalQuestionReviewersSelector,
      number.toString()
    );
  }
}

export let QuestionCoordinatorFactory = (): QuestionCoordinator =>
  new QuestionCoordinator();
