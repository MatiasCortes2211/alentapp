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
    Input,
    Badge
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuActivity, LuEye } from "react-icons/lu";
import { useEffect, useState } from "react";
import { membersService } from "../services/members";
import { medicalCertificateService } from "../services/medicalCertificateService";
import type { MemberDTO, CreateMedicalCertificate, MedicalCertificateDTO } from "@alentapp/shared"; 
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

    // State para el modal de carga (Alta)
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);

    //  NUEVOS STATES PARA EL READ (HISTORIAL)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyCertificates, setHistoryCertificates] = useState<MedicalCertificateDTO[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

    // NUEVA FUNCIÓN PARA EL READ: Abre el modal y trae los datos de la API
    const openHistoryModal = async (member: MemberDTO) => {
        setSelectedMember(member);
        setIsHistoryOpen(true);
        setIsLoadingHistory(true);
        try {
            const certs = await medicalCertificateService.getByMemberId(member.id);
            setHistoryCertificates(certs);
        } catch (err: any) {
            alert(err.message || "Error al cargar el historial clínico");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await medicalCertificateService.create({
                member_id: formData.member_id,
                issue_date: new Date(formData.issue_date).toISOString(), 
                expiry_date: new Date(formData.expiry_date).toISOString(), 
                doctor_license: formData.doctor_license.trim()
            });

            setIsDialogOpen(false);
            alert("¡Certificado registrado con éxito!");
            fetchMembers();
        } catch (err: any) {
            alert(err.message || "Error interno del servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    return (
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

            {/* MODAL 1: Cargar Certificado (Alta) */}
            <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
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
            </DialogRoot>

            {/* MODAL 2 NUEVO: Historial de Certificados (READ) */}
        
            <DialogRoot size="lg" open={isHistoryOpen} onOpenChange={(e) => setIsHistoryOpen(e.open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Historial Médico: {selectedMember?.name}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {isLoadingHistory ? (
                            <Center h="150px"><Spinner size="md" color="blue.500" /></Center>
                        ) : historyCertificates.length === 0 ? (
                            <Text textAlign="center" color="fg.muted" py="6">
                                El socio no posee ningún certificado cargado en el sistema.
                            </Text>
                        ) : (
                            <Table.Root size="sm" variant="line">
                                <Table.Header>
                                    <Table.Row bg="bg.muted/30">
                                        <Table.ColumnHeader>Emisión</Table.ColumnHeader>
                                        <Table.ColumnHeader>Vencimiento</Table.ColumnHeader>
                                        <Table.ColumnHeader>Matrícula</Table.ColumnHeader>
                                        <Table.ColumnHeader textAlign="end">Estado</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {historyCertificates.map((cert) => (
                                        <Table.Row key={cert.id}>
                                            <Table.Cell>{cert.issue_date}</Table.Cell>
                                            <Table.Cell>{cert.expiry_date}</Table.Cell>
                                            <Table.Cell>{cert.doctor_license}</Table.Cell>
                                            <Table.Cell textAlign="end">
                                                {/* 🌟 CORREGIDO: Mapeado fino con cert.is_validated */}
                                                <Badge colorPalette={cert.is_validated ? "green" : "red"}>
                                                    {cert.is_validated ? "Vigente" : "Invalido"}
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Cerrar</Button>
                        </DialogActionTrigger>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>

            {/* TABLA PRINCIPAL DE SOCIOS */}
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
                                        <HStack gap="2" justify="flex-end">
                                            {/* NUEVO BOTÓN PARA VER EL READ */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                colorPalette="gray"
                                                onClick={() => openHistoryModal(member)}
                                            >
                                                <LuEye /> Ver Historial
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorPalette="blue"
                                                variant="ghost"
                                                onClick={() => openCreateModal(member)}
                                            >
                                                <LuPlus /> Cargar Certificado
                                            </Button>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Stack>
    );
}