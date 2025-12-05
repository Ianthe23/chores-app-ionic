import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonIcon,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import {
  personOutline,
  lockClosedOutline,
  logInOutline,
  personAddOutline,
} from "ionicons/icons";
import { useAuth } from "./AuthProvider";
import { useHistory } from "react-router-dom";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async () => {
    if (!username || !password) {
      setToastMessage("Please enter both username and password");
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      history.push("/dashboard");
    } catch (error: any) {
      setToastMessage(error.response?.data?.error || "Login failed");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    history.push("/register");
  };

  return (
    <IonPage>
      <IonHeader className="modern-header header-gradient">
        <IonToolbar className="modern-toolbar">
          <IonTitle>Welcome Back</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding gradient-bg">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "100%",
          }}
        >
          <IonCard className="modern-card fade-in">
            <IonCardHeader>
              <IonCardTitle className="ion-text-center">
                <IonText color="primary">
                  <h1 className="gradient-text">ChoreFlow</h1>
                </IonText>
              </IonCardTitle>
              <IonText color="medium" className="ion-text-center">
                <p>Sign in to manage your chores</p>
              </IonText>
            </IonCardHeader>

            <IonCardContent>
              <IonItem className="modern-input" lines="none">
                <IonIcon icon={personOutline} slot="start" color="medium" />
                <IonLabel position="stacked">Username</IonLabel>
                <IonInput
                  type="text"
                  value={username}
                  onIonInput={(e) => setUsername(e.detail.value!)}
                  placeholder="Enter your username"
                />
              </IonItem>

              <IonItem
                className="modern-input"
                lines="none"
                style={{ marginTop: "16px" }}
              >
                <IonIcon icon={lockClosedOutline} slot="start" color="medium" />
                <IonLabel position="stacked">Password</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  placeholder="Enter your password"
                />
              </IonItem>

              <IonButton
                expand="block"
                className="modern-button button-gradient"
                onClick={handleLogin}
                disabled={isLoading}
                style={{ marginTop: "24px" }}
              >
                {isLoading ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>
                    <IonIcon icon={logInOutline} slot="start" />
                    Sign In
                  </>
                )}
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                className="modern-button"
                onClick={goToRegister}
                style={{ marginTop: "12px" }}
              >
                <IonIcon icon={personAddOutline} slot="start" />
                Create Account
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
