import { 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text,
  Flex,
  Input
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import { useState } from "react";
import { sportsService } from "../services/sports";
import type { Sport, CreateSport } from "@alentapp/shared";
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

const medicalCertificateOptions = createListCollection({
    items: [
        { label: "Sí", value: "true" },
        { label: "No", value: "false" },
    ]
});

export function SportsView() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateSport>({
        name: "",
        description: "",
        max_capacity: 0,
        additional_price: 0,
        requires_medical_certificate: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await sportsService.create(formData as CreateSport);
            setIsDialogOpen(false);
        } catch (err: any) {
            alert(err.message || "Error al guardar el deporte");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setFormData({
            name: "",
            description: "",
            max_capacity: null as any,
            additional_price: null as any,
            requires_medical_certificate: false,
        });
        setIsDialogOpen(true);
    };

    return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Deportes</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona el catálogo de deportes del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Deporte
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Deporte</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Nombre" required>
                  <Input
                    placeholder="Ej. Fútbol"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Descripción" required>
                  <Input
                    placeholder="Ej. Deporte de equipo"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Cupo Máximo" required>
                  <Input
                    type="text"
                    placeholder="Ej. 20"
                    value={formData.max_capacity || ""}
                    onChange={(e) => {
                        const inputValue = e.target.value;
                        const cleanValue = inputValue.replace(/\D/g, "");
                        setFormData({
                            ...formData,
                            max_capacity: cleanValue === "" ? 0  : Number(cleanValue)
                        });
                    }}
                    required
                  />
                </Field>
                <Field label="Precio Adicional" required>
                  <Input
                    type="text"
                    placeholder="Ej. 10000"
                    value={formData.additional_price}
                    onChange={(e) => {
                        const inputValue = e.target.value;
                        const cleanValue = inputValue.replace(/\D/g, "");
                        setFormData({
                            ...formData,
                            additional_price: cleanValue === "" ? 0 : Number(cleanValue)
                        });
                    }}
                    required
                  />
                </Field>
                <Field label="Requiere Certificado Médico" required>
                  <SelectRoot
                    collection={medicalCertificateOptions}
                    value={[String(formData.requires_medical_certificate)]}
                    onValueChange={(e) => setFormData({ ...formData, requires_medical_certificate: e.value[0] === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicalCertificateOptions.items.map((opt) => (
                        <SelectItem item={opt} key={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Crear Deporte
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </Stack>
    </DialogRoot>
  );
}