import { registerRootComponent } from "expo";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { persistor, store } from "./store";

function AppProviders() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate
          loading={(
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141218" }}>
              <ActivityIndicator color="#E71809" />
            </View>
          )}
          persistor={persistor}
        >
          <App />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

registerRootComponent(AppProviders);
