import shell from './shell.module.css'

export function HowTo() {
  return (
    <ol className={shell.list}>
      <li><b>Phase 0:</b> choose what you want to find out. That decides your instruments.</li>
      <li><b>Phase 1:</b> build your spacecraft. Every part adds mass, cost and power.</li>
      <li><b>Watch the meters on top.</b> Hover a card to preview its effect. Red means over the limit.</li>
      <li><b>Show the math</b> panels use the real formulas NASA engineers use.</li>
      <li>Blue chips = NASA facts. Yellow chips = game values.</li>
    </ol>
  )
}

export function SourceList({ sources }) {
  return (
    <ul className={shell.list}>
      {sources.map((source) => (
        <li key={source.url}>
          <a className={shell.link} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
        </li>
      ))}
    </ul>
  )
}
