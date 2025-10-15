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
      cy.contains('#customer-list tr', companyName)
        .should('be.visible')
        .within(() => {
          cy.get('td').eq(2)
            .invoke('text')
            .should('not.include', '<script>');
        });
      cy.get('#customer-list script').should('not.exist');
    });
  });

});
