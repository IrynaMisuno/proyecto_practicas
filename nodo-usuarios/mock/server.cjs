const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const jsonServer = require("json-server");

const databasePath = path.join(__dirname, "db.json");
const seedPath = path.join(__dirname, "seed.json");
const port = Number(process.env.MOCK_API_PORT || 3001);

fs.copyFileSync(seedPath, databasePath);

const app = jsonServer.create();
const router = jsonServer.router(databasePath);
router.render = (request, response) => {
  const data = response.locals.data;
  if (request.path === "/users" || request.path.startsWith("/users/")) {
    const withoutPasswordHash = (user) => {
      if (!user || typeof user !== "object") return user;
      const { passwordHash, ...publicUser } = user;
      return publicUser;
    };
    return response.json(Array.isArray(data) ? data.map(withoutPasswordHash) : withoutPasswordHash(data));
  }
  response.json(data);
};
app.use(jsonServer.defaults());
app.use(jsonServer.bodyParser);

app.use((request, response, next) => {
  const collectionPath = request.path === "/users" || request.path === "/roles";
  const userPath = request.path === "/users" || /^\/users\/[^/]+$/.test(request.path);
  request.body ||= {};

  if (request.method === "POST" && request.path === "/users") {
    const password = String(request.body.password || "");
    const validPassword = password.length >= 8
      && /[a-z]/.test(password)
      && /[A-Z]/.test(password)
      && /[0-9]/.test(password)
      && /[^A-Za-z0-9]/.test(password);

    if (!validPassword) {
      return response.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
    request.body.passwordHash = `scrypt$${salt}$${passwordHash}`;
    delete request.body.password;
  }

  if (request.method === "POST" && collectionPath && !request.body.id) {
    request.body.id = crypto.randomUUID();
  }
  if (["POST", "PATCH"].includes(request.method) && userPath) {
    request.body.updatedAt = new Date().toISOString();
  }

  next();
});

app.post("/auth/login", (request, response) => {
  const { identifier, password } = request.body || {};
  const validIdentifier = String(identifier || "").trim().toLowerCase() === "admin@nodo.local";

  if (validIdentifier && password === "NodoDemo2026!") {
    return response.status(200).json({
      token: "demo-token-not-for-production",
      user: { id: "usr-101", name: "Lucía Fernández", email: "admin@nodo.local", role: "Administrador" },
    });
  }

  return response.status(401).json({ error: "Credenciales inválidas" });
});

app.use(router);
app.listen(port, () => {
  console.log(`Mock API lista en http://localhost:${port}`);
  console.log("La base de pruebas se reinicia desde mock/seed.json al iniciar.");
});
