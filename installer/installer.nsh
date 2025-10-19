!macro customInstall
  ; Create per-user workspace folder under LocalAppData
  ReadEnvStr $0 "LOCALAPPDATA"
  StrCpy $1 "$0\\Chahua Code Animator\\workspace"
  DetailPrint "Creating workspace directory: $1"
  CreateDirectory "$1"
  ; Create placeholder file so folder is visible
  FileOpen $2 "$1\\.keep" w
  FileClose $2
  DetailPrint "Workspace placeholder created"
!macroend

!macro customUnInstall
  ; Do not remove user data on uninstall by default
!macroend
