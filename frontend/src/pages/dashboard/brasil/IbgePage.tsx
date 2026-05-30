// API: IBGE
// Endpoints consumidos:
//   GET /ibge/states                        → useStates()
//   GET /ibge/cities/{state}?filtro=...     → useCitiesByState(state, filtro?)

export default function IbgePage() {
  return (
    <main>
      <h1>IBGE</h1>
    </main>
  );
}