import { Box, SimpleGrid, Heading, Text, VStack } from "@chakra-ui/react";
import { LuUsers, LuBox, LuCreditCard, LuActivity } from "react-icons/lu";
import { SectionCard } from "../components/SectionCard";

export function HomeView() {
  return (
    <Box>
      <VStack gap="6" align="flex-start" mb="12">
        <Heading 
          size="4xl" 
          fontWeight="extrabold" 
          letterSpacing="tight"
          bgGradient="to-r"
          gradientFrom="blue.600"
          gradientTo="cyan.400"
          bgClip="text"
        >
          Bienvenido a Alentapp
        </Heading>
        <Text fontSize="xl" color="fg.muted" maxW="2xl">
          El panel de administración central para gestionar todos los aspectos de tu club. 
          Selecciona una sección a continuación para comenzar.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="8">
        <SectionCard 
          title="Miembros"
          description="Administra el padrón de socios, sus categorías, estados de cuenta y datos personales."
          to="/members"
          icon={LuUsers}
        />
        
        <SectionCard 
          title="Casilleros"
          description="Gestiona el inventario físico de lockers, estados de mantenimiento y contratos."
          to="/lockers"
          icon={LuBox}
        />
        
        <SectionCard 
          title="Pagos"
          description="Genera y administra las obligaciones de pago de los socios del club."
          to="/payments"
          icon={LuCreditCard}
        />

      <SectionCard 
          title="Salud"
          description="Gestiona certificados médicos, matrículas y estados de aptitud física de los socios."
          to="/salud"
          icon={LuUsers} // Un ícono de actividad/salud
        />

        <SectionCard 
          title="Sanciones"
          description="Carga nuevas sanciones a los socios, visualiza las sanciones vigentes y su historial."
          to="/disciplines"
          icon={LuUsers}
        />

        {/* Future sections can be added here following the same pattern */}
        <SectionCard 
          title="Deportes"
          description="Gestiona el catálogo de deportes, sus precios y requisitos asociados."
          to="/sports"
          icon={LuActivity}
        />
        <Box 
          p="6" 
          bg="bg.muted/30" 
          borderRadius="2xl" 
          borderWidth="1px" 
          borderColor="border.subtle"
          borderStyle="dashed"
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH="250px"
        >
          <VStack>
            <Text color="fg.muted" fontWeight="medium">Próximamente nuevas secciones</Text>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
