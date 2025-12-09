import React from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonRouterOutlet,
} from "@ionic/react";
import {
  homeOutline,
  listOutline,
  personOutline,
  addOutline,
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  trendingUpOutline,
} from "ionicons/icons";
import { useChores } from "../chores/ChoreProvider";
import { useAuth } from "../auth/AuthProvider";
import { useHistory } from "react-router-dom";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import NetworkStatus from "../components/NetworkStatus";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const Dashboard: React.FC = () => {
  const { chores, fetchChores, isLoading } = useChores();
  const { user } = useAuth();
  const history = useHistory();

  const completedChores = chores.filter(
    (chore) => chore.status === "completed"
  );
  const pendingChores = chores.filter((chore) => chore.status === "pending");
  const inProgressChores = chores.filter(
    (chore) => chore.status === "in-progress"
  );
  const overdueTasks = chores.filter(
    (chore) =>
      chore.due_date &&
      isPast(new Date(chore.due_date)) &&
      chore.status !== "completed"
  );
  const todayTasks = chores.filter(
    (chore) => chore.due_date && isToday(new Date(chore.due_date))
  );

  const handleRefresh = async (event: CustomEvent) => {
    await fetchChores();
    event.detail.complete();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <IonPage>
      <IonHeader className="modern-header">
        <IonToolbar className="modern-toolbar">
          <IonTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IonIcon icon={homeOutline} />
              Dashboard
            </div>
          </IonTitle>
          <div slot="end" style={{ paddingRight: 8 }}>
            {/* Replace the require(...) usage with the imported component */}
            <NetworkStatus
              unsyncedCount={
                JSON.parse(localStorage.getItem("chore_outbox") || "[]").length
              }
            />
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="ion-padding">
          {/* Welcome Section */}
          <IonCard className="modern-card glass-card fade-in">
            <IonCardContent>
              <IonText>
                <h2 className="gradient-text">
                  {getGreeting()}, {user?.username}!
                </h2>
                <p
                  style={{ color: "var(--ion-color-medium)", marginTop: "8px" }}
                >
                  Here's your chore overview for today
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <motion.div
                    variants={cardVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                  >
                    <IonCard className="modern-card">
                      <IonCardContent className="ion-text-center">
                        <IonIcon
                          icon={checkmarkCircleOutline}
                          style={{
                            fontSize: "2rem",
                            color: "var(--ion-color-success)",
                          }}
                        />
                        <IonText>
                          <h3 style={{ margin: "8px 0 4px 0" }}>
                            {completedChores.length}
                          </h3>
                          <p
                            style={{
                              color: "var(--ion-color-medium)",
                              fontSize: "0.9rem",
                            }}
                          >
                            Completed
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </motion.div>
                </IonCol>

                <IonCol size="6">
                  <motion.div
                    variants={cardVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                  >
                    <IonCard className="modern-card">
                      <IonCardContent className="ion-text-center">
                        <IonIcon
                          icon={timeOutline}
                          style={{
                            fontSize: "2rem",
                            color: "var(--ion-color-warning)",
                          }}
                        />
                        <IonText>
                          <h3 style={{ margin: "8px 0 4px 0" }}>
                            {pendingChores.length}
                          </h3>
                          <p
                            style={{
                              color: "var(--ion-color-medium)",
                              fontSize: "0.9rem",
                            }}
                          >
                            Pending
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </motion.div>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="6">
                  <motion.div
                    variants={cardVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                  >
                    <IonCard className="modern-card">
                      <IonCardContent className="ion-text-center">
                        <IonIcon
                          icon={trendingUpOutline}
                          style={{
                            fontSize: "2rem",
                            color: "var(--ion-color-tertiary)",
                          }}
                        />
                        <IonText>
                          <h3 style={{ margin: "8px 0 4px 0" }}>
                            {inProgressChores.length}
                          </h3>
                          <p
                            style={{
                              color: "var(--ion-color-medium)",
                              fontSize: "0.9rem",
                            }}
                          >
                            In Progress
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </motion.div>
                </IonCol>

                <IonCol size="6">
                  <motion.div
                    variants={cardVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                  >
                    <IonCard className="modern-card">
                      <IonCardContent className="ion-text-center">
                        <IonIcon
                          icon={alertCircleOutline}
                          style={{
                            fontSize: "2rem",
                            color: "var(--ion-color-danger)",
                          }}
                        />
                        <IonText>
                          <h3 style={{ margin: "8px 0 4px 0" }}>
                            {overdueTasks.length}
                          </h3>
                          <p
                            style={{
                              color: "var(--ion-color-medium)",
                              fontSize: "0.9rem",
                            }}
                          >
                            Overdue
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </motion.div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </motion.div>

          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <IonCard
              className="modern-card slide-up"
              style={{ "--animation-delay": "0.5s" } as any}
            >
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={timeOutline} style={{ marginRight: "8px" }} />
                  Today's Tasks
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {todayTasks.slice(0, 3).map((chore) => (
                  <div
                    key={chore.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--ion-color-light)",
                    }}
                  >
                    <div>
                      <IonText>
                        <h4 style={{ margin: "0 0 4px 0" }}>{chore.title}</h4>
                      </IonText>
                      <IonChip className={`priority-${chore.priority}`}>
                        {chore.priority}
                      </IonChip>
                    </div>
                    <IonChip className={`status-${chore.status}`}>
                      {chore.status}
                    </IonChip>
                  </div>
                ))}
                {todayTasks.length > 3 && (
                  <IonButton
                    fill="clear"
                    onClick={() => history.push("/chores")}
                    style={{ marginTop: "8px" }}
                  >
                    View all {todayTasks.length} tasks
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Quick Actions */}
          <IonCard
            className="modern-card slide-up"
            style={{ "--animation-delay": "0.6s" } as any}
          >
            <IonCardHeader>
              <IonCardTitle>Quick Actions</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol>
                    <IonButton
                      expand="block"
                      className="modern-button button-gradient"
                      onClick={() => history.push("/chores")}
                    >
                      <IonIcon icon={listOutline} slot="start" />
                      View All Chores
                    </IonButton>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol>
                    <IonButton
                      expand="block"
                      fill="outline"
                      className="modern-button"
                      onClick={() => history.push("/profile")}
                    >
                      <IonIcon icon={personOutline} slot="start" />
                      Profile Settings
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Floating Action Button */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            className="modern-fab"
            onClick={() => history.push("/chore/new")}
          >
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* Bottom Tab Bar */}
      <IonTabBar slot="bottom" className="modern-tab-bar">
        <IonTabButton tab="dashboard" onClick={() => history.push('/dashboard')}>
          <IonIcon icon={homeOutline} />
          <span>Dashboard</span>
        </IonTabButton>
        <IonTabButton tab="chores" onClick={() => history.push('/chores')}>
          <IonIcon icon={listOutline} />
          <span>Chores</span>
        </IonTabButton>
        <IonTabButton tab="profile" onClick={() => history.push('/profile')}>
          <IonIcon icon={personOutline} />
          <span>Profile</span>
        </IonTabButton>
      </IonTabBar>
    </IonPage>
  );
};

export default Dashboard;
