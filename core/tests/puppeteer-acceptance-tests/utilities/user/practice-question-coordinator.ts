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

const questionRoleEditorModalSelector =
  '.e2e-test-question-role-editor-container';
const checkedCheckboxSelector = '.e2e-test-checkbox-checked';
const uncheckedCheckboxSelector = '.e2e-test-checkbox-unchecked';
const saveButtonSelector = '.e2e-test-save-button';
const statsTableSelector = '.e2e-test-stats-table';
const statsListItemSelector = '.e2e-test-stats-list-item';

const totalQuestionReviewersSelector = '.e2e-test-total-question-reviewers';

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
   * Checks if the question role editor modal is visible and ready.
   */
  async expectQuestionRoleEditorModalToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(questionRoleEditorModalSelector);
    await this.waitForElementToStabilize(questionRoleEditorModalSelector);
    if (this.isViewportAtMobileWidth()) {
      await this.page.bringToFront();
      await this.page.evaluate(async () => {
        if (
          document.activeElement &&
          typeof (document.activeElement as HTMLElement).blur === 'function'
        ) {
          (document.activeElement as HTMLElement).blur();
        }
        window.scrollTo(0, 0);
        if (document.scrollingElement !== null) {
          document.scrollingElement.scrollTop = 0;
        }
        if (document.documentElement !== null) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body !== null) {
          document.body.scrollTop = 0;
        }
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      });
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
   * Checks if the contributor stats table has loaded rows specifically for the given tab.
   * @param {string} tabName - The name of the tab (e.g. 'Question Reviewer', 'Question Submitter').
   * @param {number} number - The expected number of stats rows.
   */
  async expectNumberOfStatsRowsForTabToBe(
    tabName: string,
    number: number
  ): Promise<void> {
    await this.page.waitForFunction(
      (
        tableSelector: string,
        rowSelector: string,
        loadingSelector: string,
        expectedTab: string,
        expectedCount: number
      ) => {
        const loading = document.querySelector(loadingSelector);
        if (loading) {
          return false;
        }
        if (expectedCount === 0) {
          const rows = document.querySelectorAll(rowSelector);
          return rows.length === 0;
        }
        const table = document.querySelector(tableSelector);
        if (!table) {
          return false;
        }
        const rows = document.querySelectorAll(rowSelector);
        if (rows.length !== expectedCount) {
          return false;
        }
        const header = table.querySelector('th.user-header');
        if (!header || !header.textContent?.includes(expectedTab)) {
          return false;
        }
        return true;
      },
      {},
      statsTableSelector,
      statsListItemSelector,
      '.e2e-test-loading-message',
      tabName,
      number
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
