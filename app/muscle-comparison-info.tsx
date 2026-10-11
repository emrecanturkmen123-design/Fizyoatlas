import {Disclosure} from './disclosure';
import {muscleComparisonItem,muscleComparisonFacts} from './muscle-comparison';
function FactsTable({left,right,fields}:{left:string;right:string;fields:readonly ('action'|'nerve'|'origin'|'insertion')[]}){
 const labels={action:'Hareket katkısı',nerve:'Motor innervasyon',origin:'Origo',insertion:'Insertio'};
 return <div className="muscle-comparison-table-wrap"><table className="muscle-comparison-table"><caption>Kasların kaynaklı anatomik bilgileri</caption><thead><tr><th scope="col">Özellik</th>{[left,right].map((key,i)=><th key={i} scope="col">{muscleComparisonItem(key)?.name}</th>)}</tr></thead><tbody>{fields.map(field=><tr key={field}><th scope="row">{labels[field]}</th>{[left,right].map((key,i)=><td key={i}>{muscleComparisonFacts(key,field).map(f=><p key={f.key}>{muscleComparisonItem(key)!.keys.length>1&&<strong>{f.name}: </strong>}{f.text}</p>)}</td>)}</tr>)}</tbody></table></div>;
}
export default function MuscleComparisonInfo({left,right}:{left:string;right:string}){
 return <section className="muscle-comparison-info" aria-label="Kasların işlev ve bağlantı karşılaştırması">
  <FactsTable left={left} right={right} fields={['action','nerve']}/>
  <Disclosure title="Origo, insertio ve kaynakları karşılaştır"><FactsTable left={left} right={right} fields={['origin','insertion']}/><div className="muscle-comparison-sources">{[left,right].map((key,i)=><div key={i}><h3>{muscleComparisonItem(key)?.name}</h3>{muscleComparisonFacts(key,'action').map(f=><p key={f.key}><a href={f.source} target="_blank" rel="noreferrer">{f.name} · Anatomi kaynağı</a>{f.additionalSource&&<> · <a href={f.additionalSource} target="_blank" rel="noreferrer">Ek baş kaynağı</a></>}</p>)}</div>)}</div></Disclosure>
 </section>;
}
