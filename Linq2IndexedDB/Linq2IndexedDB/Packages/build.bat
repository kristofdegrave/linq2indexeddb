if "%NuGet%"=="" SET NuGet=nuget.exe 

%NuGet% pack %SourcesPath%\Packages\IndexedbDBViewer.nuspec -version 1.2.0
%NuGet% pack %SourcesPath%\Packages\Linq2IndexedDB.nuspec -version 1.1.0
%NuGet% pack %SourcesPath%\Packages\Linq2IndexedDBWin8.nuspec -version 1.1.0
