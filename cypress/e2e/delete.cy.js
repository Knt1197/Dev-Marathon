describe('顧客情報の追加から削除までのテスト', () => {
  it('顧客情報を追加し、そのデータが削除できることを確認する', () => {
    cy.visit('http://dev.marathon.rplearn.net/kanta_maruhashi/customer/add.html');

    const randomString = Math.random().toString(36).substring(2, 5).toUpperCase();
    const companyName = `株式会社テストデータ${randomString}`;
    const uniqueContactNumber = `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    cy.get('#companyName').type(companyName);
    cy.get('#industry').type('Test');
    cy.get('#contact').type(uniqueContactNumber);
    cy.get('#location').type('Test Address');

    cy.get('#customer-form').submit();

    cy.get('#confirm-button', { timeout: 10000 }).should('be.visible');

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });

    cy.get('#confirm-button').click();

    cy.get('@alertStub', { timeout: 10000 })
      .should('have.been.calledOnceWith', '顧客情報が正常に保存されました。');

    cy.wait(2000);

    cy.get('#customer-list').contains('a', companyName).click();

    cy.on('window:confirm', (str) => {
      expect(str).to.equal('本当にこの顧客情報を削除してよろしいですか？');
      return true;
    });

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('deleteAlertStub');
    });

    cy.get('#delete-button').click();

    cy.get('@deleteAlertStub').should('have.been.calledOnceWith', '顧客情報を削除しました。');

    cy.wait(2000); 
    cy.get('#customer-list').should('not.contain', companyName);
  });
});