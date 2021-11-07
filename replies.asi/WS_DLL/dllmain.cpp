// dllmain.cpp : Defines the entry point for the DLL application.
#include "pch.h"
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <iostream>
#include <string>
#include <thread>
#include <fstream>
#include <filesystem>
// g++ -I /usr/include/boost -pthread websocket.cpp 
using namespace std;
namespace fs = std::filesystem;
namespace beast = boost::beast;         // from <boost/beast.hpp>
namespace http = beast::http;           // from <boost/beast/http.hpp>
namespace websocket = beast::websocket; // from <boost/beast/websocket.hpp>
namespace net = boost::asio;            // from <boost/asio.hpp>
using tcp = boost::asio::ip::tcp;       // from <boost/asio/ip/tcp.hpp>

//------------------------------------------------------------------------------
vector <string> getListOfScripts() {
    string modsPath = ".\\cef\\assets\\mods";
    vector <string> scripts;

    if (fs::exists(modsPath)) {
        for (auto p : fs::directory_iterator(modsPath)) {
            if (p.path().filename().extension().u8string() == ".js")
                scripts.push_back(p.path().filename().u8string());
        }

        return scripts;
    }

    return scripts;
}

void connectJsScripts() {
    string oldhtml, newHtml, text;
    bool needReplaceHtml = false;

    ifstream in(".\\cef\\assets\\index.html");

    while (getline(in, oldhtml)) {
        oldhtml += text;
    }

    newHtml = oldhtml.substr(0, oldhtml.find("</body>"));

    for (auto item : getListOfScripts()) {
        if (oldhtml.find(item) == -1) {
            needReplaceHtml = true;
            newHtml += "<script src=\"mods\\" + item + "\"></script>";
            cout << "Добавлен скрипт ->" << item << endl;
        }
    }

    newHtml += "</body></html>";

    in.close();

    if (needReplaceHtml) {
        ofstream out(".\\cef\\assets\\index.html");

        if (out.is_open()) {
            out << newHtml;
        }

        out.close();
    }

    cout << newHtml << needReplaceHtml;
}

string getReplies() {
    string replies, line;

    auto path = fs::temp_directory_path().parent_path().parent_path().parent_path();

    path += "\\Roaming\\replies.json";

    if (fs::exists(path) == 1) {
        cout << path.u8string() << endl << fs::exists(path);

        ifstream in(path);

        if (in.is_open())
        {
            while (getline(in, line))
            {
                cout << line << '\n';
                replies += line;
            }

            in.close();
        }

        return replies;
    }
    else {
        cout << "NO File!";

        ofstream out(path);

        if (out.is_open()) {
            out << "{\"repliesToComplete\":0, \"items\" : [] }";
        }

        out.close();

        return "{\"repliesToComplete\":0, \"items\" : [] }";
    }
}

int saveReplies(string data) {
    auto path = fs::temp_directory_path().parent_path().parent_path().parent_path();

    path += "\\Roaming\\replies.json";

    ofstream out(path);

    if (out.is_open()) {
        out << data;
    }

    out.close();

    return 1;
}

void socket(void* pvParams)
{
    std::cout << "started!\n";

    connectJsScripts();

    auto const address = net::ip::make_address("127.0.0.1");
    auto const port = static_cast<unsigned short>(std::atoi("2000"));

    net::io_context ioc{ 1 };

    tcp::acceptor acceptor{ ioc, {address, port} };
    for (;;)
    {

        tcp::socket socket{ ioc };

        acceptor.accept(socket);

        std::thread{ std::bind(
            //[q = std::move(socket)]() mutable { // socket will be const - mutable should be used
            [q{std::move(socket)}]() { // socket will be const - mutable should be used



            websocket::stream<tcp::socket> ws{std::move(const_cast<tcp::socket&>(q))};

            // Set a decorator to change the Server of the handshake
            // no need to set. It ıs not necessary
            ws.set_option(websocket::stream_base::decorator(
                [](websocket::response_type& res)
                {
                    res.set(http::field::server,
                    std::string(BOOST_BEAST_VERSION_STRING) +
                        " websocket-server-sync");
                            }));

            // Accept the websocket handshake
            ws.accept();

            while (true)
            {
                try
                {

                    // This buffer will hold the incoming message
                    // buffer types https://www.boost.org/doc/libs/1_75_0/libs/beast/doc/html/beast/using_io/buffer_types.html
                    // check for the best one
                    //beast::multi_buffer buffer;
                    beast::flat_buffer readBuffer;
                    beast::flat_buffer writeBuffer;

                    // Read a message
                    ws.read(readBuffer);

                    auto out = beast::buffers_to_string(readBuffer.cdata());
                    std::cout << out << std::endl;

                    if (out.substr(0, 12) == "load-replies") {
                        std::cout << "Need load replies!" << std::endl;

                        boost::beast::ostream(writeBuffer) << getReplies();
                        ws.write(writeBuffer.data());
                    }

                    if (out.substr(0, 12) == "save-replies") {
                        std::cout << "Saving replies..." << std::endl;

                        saveReplies(out.substr(15));

                        boost::beast::ostream(writeBuffer) << "saved";
                        ws.write(writeBuffer.data());
                    }

                    // Echo the message back
                    //ws.text(ws.got_text());
                    //bost::beast::ostream(buffer) << "something";
                    }
                    catch (beast::system_error const& se)
                    {
                        if (se.code() != websocket::error::closed)
                        {
                            std::cerr << "Error: " << se.code().message() << std::endl;
                            break;
                        }
                    }
                }
        }
    ) }.detach();
    }
}

BOOL APIENTRY DllMain( HMODULE hModule,
                       DWORD  ul_reason_for_call,
                       LPVOID lpReserved
                     )
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH: {
        _beginthread(socket, NULL, NULL);
        break;
    }
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

