import {
    Table,
    Button,
    Heading,
    HStack,
    IconButton,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Input
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuActivity } from "react-icons/lu";
import { useEffect, useState } from "react";
import { membersService } from "../services/members";
import { medicalCertificateService } from "../services/medicalCertificateService";
import type { MemberDTO, CreateMedicalCertificate } from "@alentapp/shared";
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

export function SaludView() {
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State para el modal de carga
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);

    // Form state basado en tu TDD-0007
    const [formData, setFormData] = useState<CreateMedicalCertificate>({
        member_id: "",
        issue_date: "",
        expiry_date: "",
        doctor_license: "",
    });

    const fetchMembers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await membersService.getAll();
            setMembers(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar los miembros");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = (member: MemberDTO) => {
        setSelectedMember(member);
        setFormData({
            member_id: member.id,
            issue_date: new Date().toISOString().split('T')[0], // Default hoy
            expiry_date: "",
            doctor_license: ""
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Aseguramos que los datos vayan limpios
            await medicalCertificateService.create({
                member_id: formData.member_id,
                issue_date: new Date(formData.issue_date).toISOString(), // Forzamos ISO
                expiry_date: new Date(formData.expiry_date).toISOString(), // Forzamos ISO
                doctor_license: formData.doctor_license.trim()
            });

            setIsDialogOpen(false);
            alert("¡Certificado registrado con éxito!");
            fetchMembers();
        } catch (err: any) {
            // Si el error viene del backend, mostramos el mensaje real
            alert(err.message || "Error interno del servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    return (
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
            <Stack gap="8">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">Gestión de Salud</Heading>
                        <Text color="fg.muted" fontSize="md">
                            Administra los certificados médicos y aptitudes físicas de los socios.
                        </Text>
                    </Stack>
                    <Button variant="outline" onClick={fetchMembers} disabled={isLoading}>
                        <LuRefreshCw /> Actualizar lista
                    </Button>
                </Flex>

                {/* Modal de CREAR Certificado */}
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Cargar Certificado: {selectedMember?.name}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Fecha de Emisión" required helperText="Debe ser la fecha que figura en el papel">
                                    <Input
                                        type="date"
                                        value={formData.issue_date}
                                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Fecha de Vencimiento" required>
                                    <Input
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Matrícula del Médico" required>
                                    <Input
                                        placeholder="Ej. MN 123456"
                                        value={formData.doctor_license}
                                        onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value })}
                                        required
                                    />
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                Registrar Certificado
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>

                <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden">
                    {isLoading ? (
                        <Center h="300px"><Spinner size="xl" color="blue.500" /></Center>
                    ) : (
                        <Table.Root size="md" variant="line" interactive>
                            <Table.Header>
                                <Table.Row bg="bg.muted/50">
                                    <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">DNI</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {members.map((member) => (
                                    <Table.Row key={member.id} _hover={{ bg: "bg.muted/30" }}>
                                        <Table.Cell fontWeight="semibold">{member.name}</Table.Cell>
                                        <Table.Cell color="fg.muted">{member.dni}</Table.Cell>
                                        <Table.Cell textAlign="end">
                                            <Button
                                                size="sm"
                                                colorPalette="blue"
                                                variant="ghost"
                                                onClick={() => openCreateModal(member)}
                                            >
                                                <LuPlus /> Cargar Certificado
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