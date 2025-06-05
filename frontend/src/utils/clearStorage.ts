// デバッグ用: ローカルストレージをクリアする関数
export const clearAllStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  // console.log('ストレージをクリアしました');
};

// この関数をブラウザのコンソールで実行できるようにする
(window as any).clearAllStorage = clearAllStorage;