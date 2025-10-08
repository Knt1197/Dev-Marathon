describe('顧客情報入力フォームのテスト', () => {
  it('顧客情報を入力して送信し、成功メッセージを確認する', () => {
    cy.visit('http://localhost:8081/customer/add.html'); // テスト対象のページにアクセス
    cy.window().then((win) => {
      // windowのalertをスタブ化し、エイリアスを設定
      cy.stub(win, 'alert').as('alertStub');
    });

    // テストデータの読み込み
    cy.fixture('customerData').then((data) => {
      // フォームの入力フィールドにテストデータを入力
      const uniqueContactNumber = `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      cy.get('#companyName').type(data.companyName);
      cy.get('#industry').type(data.industry);
      cy.get('#contact').type(uniqueContactNumber);
      cy.get('#location').type(data.location);
    });

    // フォームの送信
    cy.get('#customer-form').submit();

    cy.get('@alertStub').should('have.been.calledOnceWith', '顧客情報が正常に保存されました。');

    // フォームがリセットされたことを確認
    cy.get('#companyName').should('have.value', '');
    cy.get('#industry').should('have.value', '');
    cy.get('#contact').should('have.value', '');
    cy.get('#location').should('have.value', '');
    cy.wait(5000);
  });
});