import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { NetworkProvider } from "./network/NetworkProvider";
import { customSlideInAnimation } from "./animations/pageTransitions";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/global.css";

/* Components */
import { AuthProvider } from "./auth/AuthProvider";
import { ChoreProvider } from "./chores/ChoreProvider";
import Login from "./auth/Login";
import Register from "./auth/Register";
import PrivateRoute from "./auth/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import ChoreList from "./pages/ChoreList";
import ChoreDetail from "./pages/ChoreDetail";
import Profile from "./pages/Profile";

setupIonicReact({
  mode: "ios", // Use iOS mode for a more modern look
  rippleEffect: true,
  animated: true,
});

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <NetworkProvider>
        <AuthProvider>
          <IonRouterOutlet animation={customSlideInAnimation}>
            <Route path="/login" component={Login} exact={true} />
            <Route path="/register" component={Register} exact={true} />
            <ChoreProvider>
              <PrivateRoute
                path="/dashboard"
                component={Dashboard}
                exact={true}
              />
              <PrivateRoute path="/chores" component={ChoreList} exact={true} />
              <PrivateRoute
                path="/chore/:id"
                component={ChoreDetail}
                exact={true}
              />
              <PrivateRoute path="/profile" component={Profile} exact={true} />
            </ChoreProvider>
            {/* Root redirect based on auth state */}
            <Route
              exact
              path="/"
              render={() => {
                // lightweight inline auth check
                const savedUser = localStorage.getItem("user");
                return savedUser ? (
                  <Redirect to="/dashboard" />
                ) : (
                  <Redirect to="/login" />
                );
              }}
            />
          </IonRouterOutlet>
        </AuthProvider>
      </NetworkProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
