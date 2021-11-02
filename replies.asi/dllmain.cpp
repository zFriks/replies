// dllmain.cpp : Defines the entry point for the DLL application.

#include "pch.h"

#include "windows.h"

#include "process.h"

STARTUPINFO si;

PROCESS_INFORMATION pi;

BOOL APIENTRY DllMain(HMODULE hModule,

	DWORD ul_reason_for_call,

	LPVOID lpReserved

)

{

	switch (ul_reason_for_call)

	{

	case DLL_PROCESS_ATTACH: {

		// set the size of the structures

		ZeroMemory(&si, sizeof(si));

		si.cb = sizeof(si);

		ZeroMemory(&pi, sizeof(pi));

		// start the program up

		CreateProcess(L"replies.exe", // the path

			NULL, // Command line

			NULL, // Process handle not inheritable

			NULL, // Thread handle not inheritable

			FALSE, // Set handle inheritance to FALSE

			CREATE_NO_WINDOW, // No creation flags

			NULL, // Use parent's environment block

			NULL, // Use parent's starting directory

			&si, // Pointer to STARTUPINFO structure

			&pi // Pointer to PROCESS_INFORMATION structure (removed extra parentheses)

		);
		return 1;
	}
	case DLL_THREAD_ATTACH: {
		break;
	}
	case DLL_THREAD_DETACH: {
		break;
	}
	case DLL_PROCESS_DETACH: {
		TerminateProcess(pi.hProcess, 0);
		CloseHandle(pi.hProcess);
		CloseHandle(pi.hThread);
		break;
	}
	return TRUE;
	}
}