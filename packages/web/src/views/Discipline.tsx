import { 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text, 
  Box,
  Flex,
  Input,
  Center,
  Table 
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { disciplinesService } from "../services/disciplines";
import { membersService } from "../services/members";
import type { MemberDTO, CreateDiscipline, Discipline } from "@alentapp/shared";
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

export function DisciplineView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  
 
  const [disciplines, setDisciplines] = useState([]); 

  const [formData, setFormData] = useState({
      reason: "",
      start_date: "",
      end_date: "",
      is_total_suspension: false,
      member_id: "", 
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await membersService.getAll();
        setMembers(data);
      } catch (err) {
        console.error("Error al cargar socios", err);
      }
    };
    fetchMembers();
  }, []);

  const openCreateModal = () => {
    setFormData({
      reason: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      is_total_suspension: false,
      member_id: members.length > 0 ? members[0].id : "", 
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload: CreateDiscipline = {
        reason: formData.reason,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        is_total_suspension: formData.is_total_suspension,
        member_id: formData.member_id
      };

      await disciplinesService.create(payload);
      setIsDialogOpen(false);
      alert("¡Disciplina creada con éxito!"); 
    } catch (err: any) {
      setError(err.message || "Error al crear la disciplina");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiscipline = async (discipline: Discipline) => {
      const member = members.find(m => m.id === discipline.member_id);
      const memberName = member ? member.name : 'este socio';
      
      if (window.confirm(`¿Estás seguro de que deseas eliminar la disciplina de "${memberName}"? Esta acción no se puede deshacer.`)) {
          try {
              await disciplinesService.delete(discipline.id);
              setDisciplines(prev => prev.filter(d => d.id !== discipline.id));
              alert('¡Disciplina eliminada con éxito!');
          } catch (err: any) {
              alert(err.message || 'Error al eliminar la disciplina');
          }
      }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Disciplinas</Heading>
            <Text color="fg.muted" fontSize="md">
              Ingresar disciplinas a los socios.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" disabled={true}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Generar Disciplina
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generar Nueva Disciplina</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                {error && (
                  <Box p="3" bg="red.50" color="red.700" borderRadius="md" fontSize="sm">
                    {error}
                  </Box>
                )}
                <Field label="Socio" required>
                  <Box 
                    as="select" 
                    value={formData.member_id} 
                    onChange={(e: any) => setFormData({ ...formData, member_id: e.target.value })} 
                    required
                    w="full"
                    h="10"
                    px="3"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border.muted"
                    bg="transparent"
                    outline="none"
                   bg="whiteAlpha.100"
                  color="gray"       
                  >
                    <option value="" disabled>Seleccione un socio</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} (DNI: {member.dni})
                      </option>
                    ))}
                  </Box>
                </Field>
                <Flex gap="4">
                  <Field label="Razón" required>
                    <Input type="string" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required />
                  </Field>
                </Flex>
                <Flex gap="4">
                  <Field label="Fecha de Inicio" required>
                    <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                  </Field>
                  <Field label="Fecha de Fin" required>
                    <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                  </Field>
                </Flex>

                <Field label="Tipo Suspension:" required>
                  <Box 
                    as="select" 
                    value={formData.is_total_suspension} 
                    onChange={(e: any) => setFormData({ 
                      ...formData, 
                      is_total_suspension: e.target.value === "true" 
                    })} 
                    required
                    w="full"
                    h="10"
                    px="3"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border.muted"
                    bg="transparent"
                    outline="none"
                   bg="whiteAlpha.100"
                  color="gray"       
                  >
                    <option value="true">Total</option>
                    <option value="false">Parcial</option>
                  </Box>
                </Field>

              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Generar
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px" position="relative">
          {disciplines.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron disciplinas registradas.</Text>
                <Text fontSize="sm" color="gray.400">(La lista se implementará en la próxima actualización)</Text>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha de Inicio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha de Fin</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Disciplina Total</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Razón</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">
                        <HStack gap="2" justify="flex-end">
                          <IconButton 
                            variant="ghost" 
                            size="sm" 
                            colorPalette="red" 
                            aria-label="Eliminar disciplina"
                            onClick={() => handleDeleteDiscipline(discipline)}
                          >
                            <LuTrash2 />
                          </IconButton>
                        </HStack>
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {/*endpoint getAll */}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

      </Stack>
    </DialogRoot>
  );
}