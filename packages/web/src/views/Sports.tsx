import { 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text,
  Flex,
  Input,
  Table,
  Box,
  Spinner,
  Center
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import { useState, useEffect } from "react";
import { sportsService } from "../services/sports";
import type { Sport, CreateSport, UpdateSport } from "@alentapp/shared";
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
    const [sports, setSports] = useState<Sport[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateSport>({
      name: "",
      description: "",
      max_capacity: 0,
      additional_price: 0,
      requires_medical_certificate: false,
    });
    const [editingSport, setEditingSport] = useState<Sport | null>(null);
    const [updateData, setUpdateData] = useState<UpdateSport>({
        description: "",
        max_capacity: 0
    });

    const fetchSports = async () => {
      setLoading(true);
      setError(null);
      try {
          const data = await sportsService.getAll();
          setSports(data);
      } catch (err: any) {
          setError(err.message || "Error al obtener los deportes");
      } finally {
          setLoading(false);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          await sportsService.create(formData as CreateSport);
          setIsDialogOpen(false);
          fetchSports();
      } catch (err: any) {
          alert(err.message || "Error al guardar el deporte");
      } finally {
          setIsSubmitting(false);
      }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSport) return;
        setIsSubmitting(true);
        try {
            await sportsService.update(editingSport.id, updateData);
            setIsDialogOpen(false);
            setEditingSport(null);
            fetchSports();
        } catch (err: any) {
            alert(err.message || "Error al actualizar el deporte");
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

    const openEditModal = (sport: Sport) => {
        setEditingSport(sport);
        setUpdateData({
            description: sport.description,
            max_capacity: sport.max_capacity
        });
        setIsDialogOpen(true);
    }

    useEffect(() => {
        fetchSports();
    }, []);

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

        {editingSport && (
          <DialogContent>
              <form onSubmit={handleUpdate}>
                  <DialogHeader>
                      <DialogTitle>Editar Deporte</DialogTitle>
                  </DialogHeader>
                  <DialogBody>
                      <Stack gap="4">
                          <Field label="Descripción">
                              <Input
                                  value={updateData.description}
                                  onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })}
                              />
                          </Field>
                          <Field label="Cupo Máximo">
                              <Input
                                  type="text"
                                  value={updateData.max_capacity || ""}
                                  onChange={(e) => {
                                      const cleanValue = e.target.value.replace(/\D/g, "");
                                      setUpdateData({ ...updateData, max_capacity: cleanValue === "" ? 0 : Number(cleanValue) });
                                  }}
                              />
                          </Field>
                      </Stack>
                  </DialogBody>
                  <DialogFooter>
                      <DialogActionTrigger asChild>
                          <Button variant="outline">Cancelar</Button>
                      </DialogActionTrigger>
                      <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                          Guardar Cambios
                      </Button>
                  </DialogFooter>
                  <DialogCloseTrigger />
              </form>
          </DialogContent>
      )}

      {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md">
              <Text>{error}</Text>
          </Box>
      )}

      <Box bg="bg.panel" borderRadius="xl" borderWidth="1px" overflow="hidden" minH="300px">
          {isLoading ? (
              <Center h="300px">
                  <Spinner size="xl" color="blue.500" />
              </Center>
          ) : sports.length === 0 ? (
              <Center h="300px">
                  <Text color="fg.muted">No se encontraron deportes.</Text>
              </Center>
          ) : (
              <Table.Root size="md" variant="line" interactive>
                  <Table.Header>
                      <Table.Row bg="bg.muted/50">
                          <Table.ColumnHeader py="4">Nombre</Table.ColumnHeader>
                          <Table.ColumnHeader py="4">Descripción</Table.ColumnHeader>
                          <Table.ColumnHeader py="4">Cupo Máximo</Table.ColumnHeader>
                          <Table.ColumnHeader py="4">Precio Adicional</Table.ColumnHeader>
                          <Table.ColumnHeader py="4">Cert. Médico</Table.ColumnHeader>
                          <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                      </Table.Row>
                  </Table.Header>
                  <Table.Body>
                      {sports.map((sport) => (
                          <Table.Row key={sport.id} _hover={{ bg: "bg.muted/30" }}>
                              <Table.Cell fontWeight="semibold">{sport.name}</Table.Cell>
                              <Table.Cell color="fg.muted">{sport.description}</Table.Cell>
                              <Table.Cell color="fg.muted">{sport.max_capacity}</Table.Cell>
                              <Table.Cell color="fg.muted">{sport.additional_price}</Table.Cell>
                              <Table.Cell color="fg.muted">{sport.requires_medical_certificate ? "Sí" : "No"}</Table.Cell>
                              <Table.Cell textAlign="end">
                                  <Button variant="ghost" onClick={() => openEditModal(sport)}>
                                      Editar
                                  </Button>
                              </Table.Cell>
                          </Table.Row>
                      ))}
                  </Table.Body>
              </Table.Root>
          )}
      </Box>

      </Stack>
    </DialogRoot>
  );
}