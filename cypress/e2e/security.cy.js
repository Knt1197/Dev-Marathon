describe('セキュリティ関連のテスト', () => {

  context('URL直接アクセス', () => {
    it('入力画面を経由せずに確認画面にアクセスした場合、データが表示されない', () => {
      cy.visit('http://dev.marathon.rplearn.net/kanta_maruhashi/customer/add-confirm.html');

      cy.get('#companyName').should('have.text', '-');
      cy.get('#industry').should('have.text', '-');
    });
  });

  context('クロスサイトスクリプティング (XSS)', () => {
    it('入力値にalertスクリプトを埋め込んでも実行されない', () => {
      const xssPayload = "<script>alert('XSS')</script>";
      const companyName = `XSS TEST ${Math.random().toString(36).substring(2, 5)}`;
      const uniqueContactNumber = `00-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

      cy.intercept('POST', '**/add-customer').as('addCustomerRequest');
      cy.intercept('GET', '**/customers').as('getCustomers');

      cy.visit('http://dev.marathon.rplearn.net/kanta_maruhashi/customer/add.html');

      cy.get('#companyName').type(companyName);
      cy.get('#industry').type(xssPayload); 
      cy.get('#contact').type(uniqueContactNumber);
      cy.get('#location').type('XSS Address');

      cy.get('#customer-form').submit();

      cy.location('pathname').should('include', '/kanta_maruhashi/customer/add-confirm.html');
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('alertStub');
      });

      cy.get('#confirm-button').click();

      cy.wait('@addCustomerRequest').its('response.statusCode').should('eq', 200);

      cy.get('@alertStub')
        .should('have.been.calledOnceWith', '顧客情報が正常に保存されました。');

      cy.wait('@getCustomers');
      cy.location('pathname').should('include', '/kanta_maruhashi/customer/list.html');
      const assertCustomerInList = () => {
        return cy.get('#customer-list tr').then(($rows) => {
          const match = Array.from($rows).find((row) => row.innerText.includes(companyName));
          if (match) {
            return cy.wrap(match)
              .scrollIntoView()
              .should('be.visible')
              .within(() => {
                cy.get('td').eq(3)
                  .invoke('text')
                  .should('include', "<script>alert('XSS')</script>");
              });
          }

          return cy.get('#pagination .pagination-btn').then(($buttons) => {
            const nextButton = Array.from($buttons).find(
              (btn) => btn.textContent.trim() === '次へ' && !btn.disabled
            );
            if (!nextButton) {
              throw new Error(`顧客 ${companyName} が一覧から見つかりませんでした`);
            }
            return cy.wrap(nextButton)
              .click()
              .then(() => assertCustomerInList());
          });
        });
      };

      assertCustomerInList();
      cy.get('#customer-list script').should('not.exist');
    });
  });

});
