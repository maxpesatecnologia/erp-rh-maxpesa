function iniciais(nome) {
  return nome
    ? nome
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "?";
}

export default function Avatar({ nome, foto, size = 32 }) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome}
        className="avatar-img"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      />
    );
  }
  return (
    <div className="avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {iniciais(nome)}
    </div>
  );
}
