import { useState } from "react";
import { Provider } from "react-redux";
import AuthListener from "./AuthListener";
import { makeStore } from "./store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>
      <AuthListener />
      {children}
    </Provider>
  );
}
