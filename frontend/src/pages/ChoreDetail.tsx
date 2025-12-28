import React, { useState, useEffect } from "react";
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
  IonChip,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonModal,
  IonButtons,
  IonBackButton,
  IonToast,
  IonSpinner,
  IonAlert,
} from "@ionic/react";
import {
  arrowBackOutline,
  createOutline,
  trashOutline,
  saveOutline,
  calendarOutline,
  flagOutline,
  checkmarkCircleOutline,
  cameraOutline,
  closeCircleOutline,
  locationOutline,
} from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom";
import { useChores } from "../chores/ChoreProvider";
import { Chore, UpdateChoreRequest, CreateChoreRequest } from "../types/chore";
import { format } from "date-fns";
import { Camera, CameraResultType, CameraSource, CameraDirection } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import axios from "axios";
import MapPicker from "../components/MapPicker";
import MapView from "../components/MapView";

interface RouteParams {
  id: string;
}

const ChoreDetail: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const { getChoreById, updateChore, createChore, deleteChore } = useChores();
  const history = useHistory();

  const [chore, setChore] = useState<Chore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"pending" | "in-progress" | "completed">(
    "pending"
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [points, setPoints] = useState<number>(0);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [_photoPath, setPhotoPath] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState<string>("");

  const isNewChore = id === "new";

  useEffect(() => {
    if (!isNewChore) {
      const choreData = getChoreById(parseInt(id));
      if (choreData) {
        setChore(choreData);
        setTitle(choreData.title);
        setDescription(choreData.description || "");
        setStatus(choreData.status);
        setPriority(choreData.priority);
        setDueDate(choreData.due_date || "");
        setPhotoDataUrl(choreData.photo_url ? `http://localhost:3000${choreData.photo_url}` : "");
        setPhotoPath(choreData.photo_path || "");
        setLatitude(choreData.latitude);
        setLongitude(choreData.longitude);
        setLocationName(choreData.location_name || "");
      }
    } else {
      setIsEditing(true);
    }
  }, [id, getChoreById, isNewChore]);

  useEffect(() => {
    // when loading an existing chore, hydrate points
    if (!isNewChore && chore) {
      setPoints(chore.points ?? 0);
    }
  }, [isNewChore, chore]);

  const handleTakePhoto = async () => {
    try {
      // Check if running on native platform (iOS/Android) or web
      const isNativePlatform = Capacitor.isNativePlatform();

      if (!isNativePlatform) {
        // For web/desktop, use HTML5 MediaDevices API
        await handleWebCameraCapture();
      } else {
        // For native mobile platforms, use Capacitor Camera
        // Check and request camera permissions first
        const permissions = await Camera.checkPermissions();

        if (permissions.camera === 'denied') {
          setToastMessage("Camera permission denied. Please enable it in settings.");
          setShowToast(true);
          return;
        }

        if (permissions.camera === 'prompt' || permissions.camera === 'prompt-with-rationale') {
          const requested = await Camera.requestPermissions({ permissions: ['camera'] });
          if (requested.camera === 'denied') {
            setToastMessage("Camera permission is required to take selfies.");
            setShowToast(true);
            return;
          }
        }

        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera, // Force camera only (no gallery)
          direction: CameraDirection.Front, // Use front-facing camera for selfies
          saveToGallery: false,
          correctOrientation: true,
        });

        if (image.dataUrl) {
          setPhotoDataUrl(image.dataUrl);

          // Save photo to device using Filesystem
          try {
            const fileName = `photo_${new Date().getTime()}.${image.format}`;
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: image.dataUrl,
              directory: Directory.Data,
            });
            setPhotoPath(savedFile.uri);
          } catch (fsError) {
            console.warn("Failed to save to filesystem, continuing anyway:", fsError);
            // Continue even if filesystem save fails - we still have the dataUrl
          }

          setToastMessage("Selfie captured successfully!");
          setShowToast(true);

          // If editing existing chore, upload photo immediately
          if (!isNewChore && chore) {
            await uploadPhotoToServer(image.dataUrl);
          }
        }
      }
    } catch (error: any) {
      console.error("Error taking photo:", error);

      // More helpful error messages
      if (error.message && error.message.includes('User cancelled')) {
        setToastMessage("Photo capture cancelled");
      } else if (error.message && error.message.includes('permission')) {
        setToastMessage("Camera permission denied");
      } else {
        setToastMessage(error.message || "Failed to take selfie");
      }
      setShowToast(true);
    }
  };

  const handleWebCameraCapture = async () => {
    // Create a modal/overlay for the camera
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const overlay = document.createElement('div');

    // Style the overlay
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    video.style.cssText = `
      max-width: 90%;
      max-height: 70vh;
      border-radius: 12px;
      transform: scaleX(-1);
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      margin-top: 20px;
      display: flex;
      gap: 12px;
    `;

    const captureButton = document.createElement('button');
    captureButton.textContent = 'Capture Selfie';
    captureButton.style.cssText = `
      padding: 12px 24px;
      font-size: 16px;
      background: #3880ff;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      padding: 12px 24px;
      font-size: 16px;
      background: #666;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    `;

    buttonContainer.appendChild(captureButton);
    buttonContainer.appendChild(cancelButton);
    overlay.appendChild(video);
    overlay.appendChild(buttonContainer);
    document.body.appendChild(overlay);

    try {
      // Request camera access with front camera preference
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // 'user' = front camera
        audio: false,
      });

      video.srcObject = stream;
      video.play();

      // Wait for user to capture or cancel
      await new Promise<void>((resolve, reject) => {
        captureButton.onclick = () => {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Flip the image horizontally to match the mirrored preview
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
          }

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setPhotoDataUrl(dataUrl);
          setPhotoPath(`web_photo_${new Date().getTime()}.jpg`);
          setToastMessage("Selfie captured successfully!");
          setShowToast(true);

          // If editing existing chore, upload photo immediately
          if (!isNewChore && chore) {
            uploadPhotoToServer(dataUrl);
          }

          resolve();
        };

        cancelButton.onclick = () => {
          reject(new Error('Capture cancelled'));
        };
      });

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw error;
    } finally {
      // Clean up
      document.body.removeChild(overlay);
    }
  };

  const uploadPhotoToServer = async (dataUrl: string, choreParam?: Chore) => {
    const targetChore = choreParam || chore;
    if (!targetChore) return;

    setIsUploadingPhoto(true);
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('photo', blob, 'photo.jpg');

      // Get token from localStorage
      const token = localStorage.getItem('token');

      // Upload to server
      const uploadResponse = await axios.post(
        `http://localhost:3000/api/chores/${targetChore.id}/photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Update local state with server response
      if (uploadResponse.data.photo_url) {
        setPhotoDataUrl(`http://localhost:3000${uploadResponse.data.photo_url}`);
        setToastMessage("Photo uploaded successfully!");
        setShowToast(true);
      }
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      setToastMessage(error.message || "Failed to upload photo");
      setShowToast(true);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl("");
    setPhotoPath("");
  };

  const handleLocationSelect = (lat: number, lng: number, locName: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationName(locName);
  };

  const handleRemoveLocation = () => {
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationName("");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setToastMessage("Title is required");
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const choreData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        points: Number.isFinite(Number(points)) ? Number(points) : 0,
        latitude: latitude,
        longitude: longitude,
        location_name: locationName || undefined,
        ...(isNewChore ? {} : { status }),
      };

      if (isNewChore) {
        const newChore = await createChore(choreData as CreateChoreRequest);

        // If there's a photo, upload it after creating the chore
        if (photoDataUrl && newChore) {
          await uploadPhotoToServer(photoDataUrl, newChore);
        }

        setToastMessage("Chore created successfully");
        history.push("/chores");
      } else {
        const updatedChore = await updateChore(
          parseInt(id),
          choreData as UpdateChoreRequest
        );
        setChore(updatedChore);
        setToastMessage("Chore updated successfully");
        setIsEditing(false);
      }
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || "Failed to save chore");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isNewChore) {
      setIsLoading(true);
      try {
        await deleteChore(parseInt(id));
        setToastMessage("Chore deleted successfully");
        setShowToast(true);
        history.push("/chores");
      } catch (error: any) {
        setToastMessage(error.message || "Failed to delete chore");
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

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

  return (
    <IonPage>
      <IonHeader className="modern-header">
        <IonToolbar className="modern-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/chores" icon={arrowBackOutline} />
          </IonButtons>
          <IonTitle>
            {isNewChore
              ? "New Chore"
              : isEditing
              ? "Edit Chore"
              : "Chore Details"}
          </IonTitle>
          {!isNewChore && !isEditing && (
            <IonButtons slot="end">
              <IonButton onClick={() => setIsEditing(true)}>
                <IonIcon icon={createOutline} />
              </IonButton>
              <IonButton
                color="danger"
                onClick={() => setShowDeleteAlert(true)}
              >
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {isEditing ? (
          <div className="fade-in">
            <IonCard className="modern-card">
              <IonCardHeader>
                <IonCardTitle>
                  {isNewChore ? "Create New Chore" : "Edit Chore"}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem className="modern-input" lines="none">
                  <IonLabel position="stacked">Title *</IonLabel>
                  <IonInput
                    value={title}
                    onIonInput={(e) => setTitle(e.detail.value!)}
                    placeholder="Enter chore title"
                  />
                </IonItem>

                <IonItem
                  className="modern-input"
                  lines="none"
                  style={{ marginTop: "16px" }}
                >
                  <IonLabel position="stacked">Points</IonLabel>
                  <IonInput
                    type="number"
                    value={String(points)}
                    onIonInput={(e) => {
                      const v = Number(e.detail.value);
                      setPoints(Number.isFinite(v) ? v : 0);
                    }}
                    placeholder="e.g. 3"
                    inputmode="numeric"
                  />
                </IonItem>

                <IonItem
                  className="modern-input"
                  lines="none"
                  style={{ marginTop: "16px" }}
                >
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    value={description}
                    onIonInput={(e) => setDescription(e.detail.value!)}
                    placeholder="Enter chore description"
                    rows={3}
                  />
                </IonItem>

                {!isNewChore && (
                  <IonItem
                    className="modern-input"
                    lines="none"
                    style={{ marginTop: "16px" }}
                  >
                    <IonLabel position="stacked">Status</IonLabel>
                    <IonSelect
                      value={status}
                      onIonChange={(e) => setStatus(e.detail.value)}
                      placeholder="Select status"
                      interface="popover"
                      style={{ "--color": "var(--ion-text-color)" }}
                    >
                      <IonSelectOption value="pending">
                        🟡 Pending
                      </IonSelectOption>
                      <IonSelectOption value="in-progress">
                        🔵 In Progress
                      </IonSelectOption>
                      <IonSelectOption value="completed">
                        🟢 Completed
                      </IonSelectOption>
                    </IonSelect>
                  </IonItem>
                )}

                <IonItem
                  className="modern-input"
                  lines="none"
                  style={{ marginTop: "16px" }}
                >
                  <IonLabel position="stacked">Priority</IonLabel>
                  <IonSelect
                    value={priority}
                    onIonChange={(e) => setPriority(e.detail.value)}
                    placeholder="Select priority"
                    interface="popover"
                    style={{ "--color": "var(--ion-text-color)" }}
                  >
                    <IonSelectOption value="low">🟢 Low</IonSelectOption>
                    <IonSelectOption value="medium">🟡 Medium</IonSelectOption>
                    <IonSelectOption value="high">🔴 High</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem
                  className="modern-input"
                  lines="none"
                  style={{ marginTop: "16px" }}
                  button
                  onClick={() => setShowDateModal(true)}
                >
                  <IonIcon icon={calendarOutline} slot="start" color="medium" />
                  <IonLabel>
                    <h3>Due Date</h3>
                    <p>
                      {dueDate
                        ? format(new Date(dueDate), "PPP")
                        : "No due date set"}
                    </p>
                  </IonLabel>
                </IonItem>

                {/* Photo Section */}
                <div style={{ marginTop: "16px" }}>
                  <IonText>
                    <h3 style={{ marginBottom: "8px", paddingLeft: "16px" }}>
                      Photo
                    </h3>
                  </IonText>
                  {photoDataUrl ? (
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <img
                        src={photoDataUrl}
                        alt="Chore"
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "12px",
                        }}
                      />
                      <IonButton
                        fill="clear"
                        size="small"
                        color="danger"
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          backgroundColor: "rgba(0,0,0,0.6)",
                        }}
                        onClick={handleRemovePhoto}
                      >
                        <IonIcon icon={closeCircleOutline} />
                      </IonButton>
                    </div>
                  ) : null}
                  <IonButton
                    expand="block"
                    fill="outline"
                    className="modern-button"
                    onClick={handleTakePhoto}
                    disabled={isUploadingPhoto}
                  >
                    {isUploadingPhoto ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      <>
                        <IonIcon icon={cameraOutline} slot="start" />
                        {photoDataUrl ? "Retake Selfie" : "Take Selfie"}
                      </>
                    )}
                  </IonButton>
                </div>

                {/* Location Section */}
                <div style={{ marginTop: "16px" }}>
                  <IonText>
                    <h3 style={{ marginBottom: "8px", paddingLeft: "16px" }}>
                      Location
                    </h3>
                  </IonText>
                  {latitude && longitude ? (
                    <div style={{ marginBottom: "8px" }}>
                      <IonItem lines="none" className="modern-input">
                        <IonIcon icon={locationOutline} slot="start" color="primary" />
                        <IonLabel>
                          <p style={{ color: "var(--ion-color-medium)" }}>
                            {locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                          </p>
                        </IonLabel>
                        <IonButton
                          fill="clear"
                          size="small"
                          color="danger"
                          onClick={handleRemoveLocation}
                        >
                          <IonIcon icon={closeCircleOutline} />
                        </IonButton>
                      </IonItem>
                    </div>
                  ) : null}
                  <IonButton
                    expand="block"
                    fill="outline"
                    className="modern-button"
                    onClick={() => setShowMapModal(true)}
                  >
                    <IonIcon icon={locationOutline} slot="start" />
                    {latitude && longitude ? "Change Location" : "Set Location"}
                  </IonButton>
                </div>

                <div
                  style={{ display: "flex", gap: "12px", marginTop: "24px" }}
                >
                  <IonButton
                    expand="block"
                    className="modern-button button-gradient"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      <>
                        <IonIcon icon={saveOutline} slot="start" />
                        {isNewChore ? "Create" : "Save"}
                      </>
                    )}
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    className="modern-button"
                    onClick={() => {
                      if (isNewChore) {
                        history.push("/chores");
                      } else {
                        setIsEditing(false);
                        // Reset form to original values
                        if (chore) {
                          setTitle(chore.title);
                          setDescription(chore.description || "");
                          setStatus(chore.status);
                          setPriority(chore.priority);
                          setDueDate(chore.due_date || "");
                        }
                      }
                    }}
                  >
                    Cancel
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        ) : chore ? (
          <div className="fade-in">
            <IonCard className="modern-card">
              <IonCardHeader>
                <IonCardTitle>{chore.title}</IonCardTitle>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <IonChip color={getStatusColor(chore.status)}>
                    <IonIcon icon={checkmarkCircleOutline} />
                    <IonLabel>{chore.status}</IonLabel>
                  </IonChip>
                  <IonChip color={getPriorityColor(chore.priority)}>
                    <IonIcon icon={flagOutline} />
                    <IonLabel>{chore.priority} priority</IonLabel>
                  </IonChip>
                  <IonChip color="medium">
                    <IonLabel>{chore.points} pts</IonLabel>
                  </IonChip>
                </div>
              </IonCardHeader>
              <IonCardContent>
                {chore.photo_url && (
                  <div style={{ marginBottom: "16px" }}>
                    <img
                      src={`http://localhost:3000${chore.photo_url}`}
                      alt="Chore"
                      style={{
                        width: "100%",
                        height: "250px",
                        objectFit: "cover",
                        borderRadius: "12px",
                      }}
                    />
                  </div>
                )}

                {chore.description && (
                  <div style={{ marginBottom: "16px" }}>
                    <IonText>
                      <h3>Description</h3>
                      <p style={{ color: "var(--ion-color-medium)" }}>
                        {chore.description}
                      </p>
                    </IonText>
                  </div>
                )}

                {chore.due_date && (
                  <div style={{ marginBottom: "16px" }}>
                    <IonText>
                      <h3>Due Date</h3>
                      <p style={{ color: "var(--ion-color-medium)" }}>
                        <IonIcon
                          icon={calendarOutline}
                          style={{ marginRight: "8px" }}
                        />
                        {format(new Date(chore.due_date), "PPP")}
                      </p>
                    </IonText>
                  </div>
                )}

                {chore.latitude && chore.longitude && (
                  <div style={{ marginBottom: "16px" }}>
                    <IonText>
                      <h3>Location</h3>
                      {chore.location_name && (
                        <p style={{ color: "var(--ion-color-medium)", marginBottom: "8px" }}>
                          <IonIcon
                            icon={locationOutline}
                            style={{ marginRight: "8px" }}
                          />
                          {chore.location_name}
                        </p>
                      )}
                    </IonText>
                    <MapView
                      latitude={chore.latitude}
                      longitude={chore.longitude}
                      locationName={chore.location_name}
                      title={chore.title}
                    />
                  </div>
                )}

                <div style={{ marginBottom: "16px" }}>
                  <IonText>
                    <h3>Created</h3>
                    <p style={{ color: "var(--ion-color-medium)" }}>
                      {format(new Date(chore.created_at), "PPP")}
                    </p>
                  </IonText>
                </div>

                {chore.updated_at !== chore.created_at && (
                  <div>
                    <IonText>
                      <h3>Last Updated</h3>
                      <p style={{ color: "var(--ion-color-medium)" }}>
                        {format(new Date(chore.updated_at), "PPP")}
                      </p>
                    </IonText>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <IonSpinner name="crescent" color="primary" />
          </div>
        )}

        {/* Date Picker Modal */}
        <IonModal
          isOpen={showDateModal}
          onDidDismiss={() => setShowDateModal(false)}
          initialBreakpoint={0.75}
          breakpoints={[0, 0.5, 0.75, 1]}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Due Date</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDateModal(false)}>
                  Done
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px'
            }}>
              <IonDatetime
                value={dueDate}
                onIonChange={(e) => setDueDate(e.detail.value as string)}
                presentation="date"
                style={{ width: '100%', maxWidth: '500px' }}
              />
            </div>
            <div className="ion-padding">
              <IonButton
                expand="block"
                fill="clear"
                onClick={() => {
                  setDueDate("");
                  setShowDateModal(false);
                }}
              >
                Clear Due Date
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Map Picker Modal */}
        <IonModal
          isOpen={showMapModal}
          onDidDismiss={() => setShowMapModal(false)}
          initialBreakpoint={0.9}
          breakpoints={[0, 0.5, 0.75, 0.9, 1]}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Location</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMapModal(false)}>
                  Done
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={handleLocationSelect}
            />
          </IonContent>
        </IonModal>

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
              handler: handleDelete,
            },
          ]}
        />

        {/* Toast for feedback */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default ChoreDetail;
