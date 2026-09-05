import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Pencil } from "lucide-react";
import { Avatar, Button, Modal, useToast } from "@vtc/ui";
import type { Driver } from "@vtc/types";
import { apiClient } from "../../api";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

// Sans vrai backend de stockage, l'image choisie est convertie en data URL
// et enregistree directement comme avatarUrl -- ca fonctionne reellement
// (affichage immediat, persiste comme toute autre modification de la
// session) plutot que de simuler un upload qui ne stocke rien.
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DriverAvatarUpload({ driver }: { driver: Driver }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const avatarUrl = await readAsDataUrl(file);
      return apiClient.drivers.update(driver.id, { avatarUrl });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["drivers", driver.id], updated);
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast("Photo mise à jour.");
    },
    onError: () => showToast("L'envoi de la photo a échoué.", "danger"),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choisissez un fichier image.", "danger");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      showToast("Image trop lourde (2 Mo maximum).", "danger");
      return;
    }
    mutation.mutate(file);
  }

  const hasPhoto = !!driver.avatarUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => (hasPhoto ? setLightboxOpen(true) : inputRef.current?.click())}
        disabled={mutation.isPending}
        className="group relative flex-shrink-0 rounded-full disabled:cursor-not-allowed"
        aria-label={hasPhoto ? "Voir la photo du chauffeur" : "Ajouter une photo"}
        title={hasPhoto ? "Voir la photo" : "Ajouter une photo"}
      >
        <Avatar firstName={driver.firstName} lastName={driver.lastName} avatarUrl={driver.avatarUrl} size="lg" />
        {hasPhoto ? (
          // Photo deja presente : l'agrandir est un geste secondaire,
          // l'indice au survol suffit (moins critique a decouvrir).
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/0 text-transparent transition-colors group-hover:bg-ink/50 group-hover:text-white">
            <Camera size={18} />
          </span>
        ) : (
          // Pas de photo : au survol seul, l'affordance est invisible au
          // tactile et facile a manquer -- badge permanent, meme pattern que
          // LinkedIn/Google pour "ajouter une photo de profil".
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-ink text-white transition-colors group-hover:bg-ink-soft">
            <Camera size={12} />
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {hasPhoto && (
        <Modal open={lightboxOpen} title={`${driver.firstName} ${driver.lastName}`} onClose={() => setLightboxOpen(false)}>
          <div className="flex flex-col items-center gap-4">
            <img
              src={driver.avatarUrl!}
              alt=""
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
            <Button
              variant="secondary"
              onClick={() => {
                setLightboxOpen(false);
                inputRef.current?.click();
              }}
              disabled={mutation.isPending}
            >
              <Pencil size={15} />
              Changer la photo
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
