import java.security.*;
import java.nio.file.*;
import java.util.Base64;

public class GenerateFlowKeys {
    public static void main(String[] args) throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair pair = gen.generateKeyPair();

        String priv = "-----BEGIN PRIVATE KEY-----\n"
            + Base64.getMimeEncoder(64, new byte[]{'\n'})
                .encodeToString(pair.getPrivate().getEncoded())
            + "\n-----END PRIVATE KEY-----\n";

        String pub = "-----BEGIN PUBLIC KEY-----\n"
            + Base64.getMimeEncoder(64, new byte[]{'\n'})
                .encodeToString(pair.getPublic().getEncoded())
            + "\n-----END PUBLIC KEY-----\n";

        Files.writeString(Path.of("flow_private.pem"), priv);
        Files.writeString(Path.of("flow_public.pem"), pub);
        System.out.println("RSA keys generated successfully.");
    }
}
