type Props = {
  file: File | null
  setFile: (f: File | null) => void
  onParse: () => void
  loading: boolean
}

export default function UploadArea({ file, setFile, onParse, loading }: Props) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  return (
    <div className="upload">
      <input type="file" accept="application/pdf" onChange={onChange} />
      {file && <div className="file">{file.name}</div>}
      <button disabled={!file || loading} onClick={onParse}>
        {loading ? 'Parsing…' : 'Parse'}
      </button>
    </div>
  )
}
