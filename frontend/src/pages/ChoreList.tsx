import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonIcon,
  IonChip,
  IonButton,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonTabBar,
  IonTabButton,
  IonSpinner,
  IonAlert,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  listOutline,
  addOutline,
  homeOutline,
  personOutline,
  searchOutline,
  calendarOutline,
  trashOutline,
  createOutline,
  imageOutline,
} from "ionicons/icons";
import { useChores } from "../chores/ChoreProvider";
import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import NetworkStatus from "../components/NetworkStatus";

const ChoreList: React.FC = () => {
  const {
    chores,
    fetchChores,
    deleteChore,
    updateChore,
    isLoading,
    page,
    hasMore,
  } = useChores();
  const [searchText, setSearchText] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [choreToDelete, setChoreToDelete] = useState<number | null>(null);
  const history = useHistory();

  // Responsive filter: dropdown on small screens, 2x2 grid otherwise
  const [useDropdown, setUseDropdown] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const handler = (e: MediaQueryListEvent | { matches: boolean }) => {
      setUseDropdown((e as any).matches);
    };
    setUseDropdown(mq.matches);
    mq.addEventListener("change", handler as any);
    return () => mq.removeEventListener("change", handler as any);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchChores(1, {
      status:
        selectedSegment === "all"
          ? undefined
          : (selectedSegment as "pending" | "in-progress" | "completed"),
      q: searchText.trim() || undefined,
    });
  }, []);

  // Refetch when filter changes
  useEffect(() => {
    fetchChores(1, {
      status:
        selectedSegment === "all"
          ? undefined
          : (selectedSegment as "pending" | "in-progress" | "completed"),
      q: searchText.trim() || undefined,
    });
  }, [selectedSegment]);

  // Refetch when search changes (basic immediate update; can debounce if preferred)
  useEffect(() => {
    fetchChores(1, {
      status:
        selectedSegment === "all"
          ? undefined
          : (selectedSegment as "pending" | "in-progress" | "completed"),
      q: searchText.trim() || undefined,
    });
  }, [searchText]);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchChores(page, {
      status:
        selectedSegment === "all"
          ? undefined
          : (selectedSegment as "pending" | "in-progress" | "completed"),
      q: searchText.trim() || undefined,
    });
    event.detail.complete();
  };

  const handleDeleteChore = async () => {
    if (choreToDelete) {
      try {
        await deleteChore(choreToDelete);
        setShowDeleteAlert(false);
        setChoreToDelete(null);
      } catch (error) {
        console.error("Failed to delete chore:", error);
      }
    }
  };

  const filteredChores = chores.filter((chore) => {
    const matchesSearch =
      chore.title.toLowerCase().includes(searchText.toLowerCase()) ||
      chore.description?.toLowerCase().includes(searchText.toLowerCase());

    if (selectedSegment === "all") return matchesSearch;
    return matchesSearch && chore.status === selectedSegment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "tertiary";
      case "pending":
        return "warning";
      default:
        return "medium";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "medium";
      default:
        return "medium";
    }
  };

  const handleStatusChange = async (choreId: number, currentStatus: string) => {
    const statusOrder = ["pending", "in-progress", "completed"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex] as
      | "pending"
      | "in-progress"
      | "completed";

    try {
      await updateChore(choreId, { status: newStatus });
      await fetchChores(page, {
        status:
          selectedSegment === "all"
            ? undefined
            : (selectedSegment as "pending" | "in-progress" | "completed"),
        q: searchText.trim() || undefined,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <IonPage>
      <IonHeader className="modern-header">
        <IonToolbar className="modern-toolbar">
          <IonTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IonIcon icon={listOutline} />
              Chores
            </div>
          </IonTitle>
          <div slot="end" style={{ paddingRight: 8 }}>
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

        <div className="ion-padding-horizontal ion-padding-top">
          {/* Search Bar */}
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search chores..."
            className="modern-input"
          />

          {/* Help text */}
          <IonText
            color="medium"
            style={{ fontSize: "0.8rem", padding: "0 16px" }}
          >
            <p>
              💡 Tip: Click on status chips to quickly change status (pending →
              in-progress → completed)
            </p>
          </IonText>

          {useDropdown ? (
            <IonItem
              className="modern-input"
              lines="none"
              style={{ marginTop: 8 }}
            >
              <IonLabel>Filter</IonLabel>
              <IonSelect
                value={selectedSegment}
                onIonChange={(e) => setSelectedSegment(e.detail.value)}
                interface="action-sheet"
              >
                <IonSelectOption value="all">All</IonSelectOption>
                <IonSelectOption value="pending">Pending</IonSelectOption>
                <IonSelectOption value="in-progress">
                  In Progress
                </IonSelectOption>
                <IonSelectOption value="completed">Completed</IonSelectOption>
              </IonSelect>
            </IonItem>
          ) : (
            <div style={{ padding: "0 16px", marginTop: 8 }}>
              <IonGrid fixed>
                <IonRow>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill={selectedSegment === "all" ? "solid" : "outline"}
                      onClick={() => setSelectedSegment("all")}
                    >
                      All
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill={selectedSegment === "pending" ? "solid" : "outline"}
                      onClick={() => setSelectedSegment("pending")}
                    >
                      Pending
                    </IonButton>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill={
                        selectedSegment === "in-progress" ? "solid" : "outline"
                      }
                      onClick={() => setSelectedSegment("in-progress")}
                    >
                      In Progress
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill={
                        selectedSegment === "completed" ? "solid" : "outline"
                      }
                      onClick={() => setSelectedSegment("completed")}
                    >
                      Completed
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        <div
          className="ion-padding"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <IonButton
            color="medium"
            disabled={isLoading || page <= 1}
            onClick={() => fetchChores(page - 1)}
          >
            Previous
          </IonButton>

          <IonText>Page {page}</IonText>

          <IonButton
            color="primary"
            disabled={isLoading || !hasMore}
            onClick={() => fetchChores(page + 1)}
          >
            Next
          </IonButton>
        </div>

        {/* Chore List */}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <IonList className="modern-list">
            {filteredChores.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <IonIcon
                  icon={searchOutline}
                  style={{ fontSize: "3rem", color: "var(--ion-color-medium)" }}
                />
                <IonText color="medium">
                  <p>No chores found</p>
                </IonText>
              </div>
            ) : (
              filteredChores.map((chore) => (
                <IonItem
                  key={chore.id}
                  className="modern-list-item fade-in"
                  button
                  onClick={() => history.push(`/chore/${chore.id}`)}
                >
                  {chore.photo_url ? (
                    <img
                      src={`http://localhost:3000${chore.photo_url}`}
                      alt={chore.title}
                      slot="start"
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginRight: "12px",
                      }}
                    />
                  ) : (
                    <div
                      slot="start"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "var(--ion-color-light)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                      }}
                    >
                      <IonIcon
                        icon={imageOutline}
                        style={{
                          fontSize: "24px",
                          color: "var(--ion-color-medium)",
                        }}
                      />
                    </div>
                  )}
                  <IonLabel>
                    <h2>{chore.title}</h2>
                    {chore.description && (
                      <p style={{ color: "var(--ion-color-medium)" }}>
                        {chore.description.length > 50
                          ? `${chore.description.substring(0, 50)}...`
                          : chore.description}
                      </p>
                    )}
                    <div
                      className="chip-container"
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "8px",
                        alignItems: "center",
                      }}
                    >
                      <IonChip
                        color={getStatusColor(chore.status)}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(chore.id, chore.status);
                        }}
                      >
                        <IonLabel>{chore.status}</IonLabel>
                      </IonChip>
                      <IonChip color={getPriorityColor(chore.priority)}>
                        <IonLabel>{chore.priority}</IonLabel>
                      </IonChip>
                      <IonChip color="medium">
                        <IonLabel>{chore.points} pts</IonLabel>
                      </IonChip>
                      {chore.due_date && (
                        <IonChip color="tertiary">
                          <IonIcon
                            icon={calendarOutline}
                            style={{ marginRight: "4px" }}
                          />
                          <IonLabel>
                            {format(new Date(chore.due_date), "MMM dd")}
                          </IonLabel>
                        </IonChip>
                      )}
                    </div>
                  </IonLabel>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      flexDirection: "column",
                    }}
                  >
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        history.push(`/chore/${chore.id}`);
                      }}
                      title="Edit chore"
                    >
                      <IonIcon icon={createOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      color="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChoreToDelete(chore.id);
                        setShowDeleteAlert(true);
                      }}
                      title="Delete chore"
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                </IonItem>
              ))
            )}
          </IonList>
        )}

        {/* Floating Action Button */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            className="modern-fab"
            onClick={() => history.push("/chore/new")}
            title="Create new chore"
          >
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Chore"
          message="Are you sure you want to delete this chore? This action cannot be undone."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Delete",
              role: "destructive",
              handler: handleDeleteChore,
            },
          ]}
        />
      </IonContent>

      {/* Bottom Tab Bar */}
      <IonTabBar slot="bottom" className="modern-tab-bar">
        <IonTabButton
          tab="dashboard"
          onClick={() => history.push("/dashboard")}
        >
          <IonIcon icon={homeOutline} />
          <span>Dashboard</span>
        </IonTabButton>
        <IonTabButton tab="chores" onClick={() => history.push("/chores")}>
          <IonIcon icon={listOutline} />
          <span>Chores</span>
        </IonTabButton>
        <IonTabButton tab="profile" onClick={() => history.push("/profile")}>
          <IonIcon icon={personOutline} />
          <span>Profile</span>
        </IonTabButton>
      </IonTabBar>
    </IonPage>
  );
};

export default ChoreList;
