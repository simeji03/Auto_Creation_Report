import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>月報作成支援ツール</h1>
        <p>アプリケーションが起動しています</p>
        <Routes>
          <Route path="/" element={<div>ホームページ</div>} />
          <Route path="/login" element={<div>ログインページ</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;