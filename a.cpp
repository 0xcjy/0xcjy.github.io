#include <iostream>
#include <fstream>
#include <string>
#include <regex>
#include <algorithm>
#include <cmath>
#include <iomanip>
#include <sstream>

using namespace std;

// 从RGB字符串中提取三个颜色分量
bool extractRGB(const string& rgbStr, int& r, int& g, int& b) {
	regex rgbRegex(R"(rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\))", regex_constants::icase);
	smatch match;
	
	if (regex_search(rgbStr, match, rgbRegex) && match.size() == 4) {
		r = stoi(match[1].str());
		g = stoi(match[2].str());
		b = stoi(match[3].str());
		return true;
	}
	return false;
}

// 从十六进制颜色字符串中提取三个颜色分量
bool extractHex(const string& hexStr, int& r, int& g, int& b) {
	regex hexRegex(R"(#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2}))");
	smatch match;
	
	if (regex_search(hexStr, match, hexRegex) && match.size() == 4) {
		r = stoi(match[1].str(), nullptr, 16);
		g = stoi(match[2].str(), nullptr, 16);
		b = stoi(match[3].str(), nullptr, 16);
		return true;
	}
	
	// 处理缩写形式 #RGB
	regex shortHexRegex(R"(#?([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F]))");
	if (regex_search(hexStr, match, shortHexRegex) && match.size() == 4) {
		r = stoi(string(2, match[1].str()[0]), nullptr, 16);
		g = stoi(string(2, match[2].str()[0]), nullptr, 16);
		b = stoi(string(2, match[3].str()[0]), nullptr, 16);
		return true;
	}
	
	return false;
}

// 计算颜色的感知亮度（使用W3C推荐公式）
double calculateLuminance(int r, int g, int b) {
	double sr = r / 255.0;
	double sg = g / 255.0;
	double sb = b / 255.0;
	
	sr = (sr <= 0.03928) ? sr / 12.92 : pow((sr + 0.055) / 1.055, 2.4);
	sg = (sg <= 0.03928) ? sg / 12.92 : pow((sg + 0.055) / 1.055, 2.4);
	sb = (sb <= 0.03928) ? sb / 12.92 : pow((sb + 0.055) / 1.055, 2.4);
	
	return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
}

// 反转亮度并生成新的RGB颜色
string invertBrightness(int r, int g, int b, bool keepFormat) {
	// 计算相对亮度（简单方法）
	double brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
	
	// 反转亮度
	double invertedBrightness = 1.0 - brightness;
	
	// 如果颜色接近黑色或白色，直接反转
	if (brightness < 0.1 || brightness > 0.9) {
		if (keepFormat) {
			return "rgb(" + to_string(255 - r) + "," + to_string(255 - g) + "," + to_string(255 - b) + ")";
		} else {
			stringstream ss;
			ss << "#" << hex << setw(2) << setfill('0') << (255 - r)
			<< setw(2) << (255 - g) << setw(2) << (255 - b);
			return ss.str();
		}
	}
	
	// 否则调整颜色以匹配反转的亮度
	double scale = invertedBrightness / brightness;
	int newR = min(255, max(0, static_cast<int>(r * scale)));
	int newG = min(255, max(0, static_cast<int>(g * scale)));
	int newB = min(255, max(0, static_cast<int>(b * scale)));
	
	if (keepFormat) {
		return "rgb(" + to_string(newR) + "," + to_string(newG) + "," + to_string(newB) + ")";
	} else {
		stringstream ss;
		ss << "#" << hex << setw(2) << setfill('0') << newR
		<< setw(2) << newG << setw(2) << newB;
		return ss.str();
	}
}

// 处理HTML内容，转换所有RGB和十六进制颜色
string processHTML(const string& htmlContent) {
	// 匹配RGB颜色
	regex rgbRegex(R"(\b(rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))\b)", regex_constants::icase);
	// 匹配十六进制颜色（完整和缩写形式）
	regex hexRegex(R"((#(?:[0-9a-fA-F]{3}){1,2})\b)");
	
	string result = htmlContent;
	size_t offset = 0;
	
	// 先处理十六进制颜色
	sregex_iterator hexIt(result.begin(), result.end(), hexRegex);
	sregex_iterator end;
	
	for (; hexIt != end; ++hexIt) {
		smatch match = *hexIt;
		string hexStr = match.str();
		
		int r, g, b;
		if (extractHex(hexStr, r, g, b)) {
			string invertedColor = invertBrightness(r, g, b, false);
			
			size_t pos = match.position() + offset;
			result.replace(pos, hexStr.length(), invertedColor);
			offset += invertedColor.length() - hexStr.length();
		}
	}
	
	// 然后处理RGB颜色
	sregex_iterator rgbIt(result.begin(), result.end(), rgbRegex);
	
	for (; rgbIt != end; ++rgbIt) {
		smatch match = *rgbIt;
		string rgbStr = match.str();
		
		int r, g, b;
		if (extractRGB(rgbStr, r, g, b)) {
			string invertedColor = invertBrightness(r, g, b, true);
			
			size_t pos = match.position() + offset;
			result.replace(pos, rgbStr.length(), invertedColor);
			offset += invertedColor.length() - rgbStr.length();
		}
	}
	
	return result;
}

int main() {
	
	string inputFile;
	string outputFile;
	cin>>inputFile>>outputFile;
	
	// 读取输入文件
	ifstream inFile(inputFile);
	if (!inFile) {
		cerr << "Error: Could not open input file " << inputFile << endl;
		return 1;
	}
	
	string content((istreambuf_iterator<char>(inFile)), 
		istreambuf_iterator<char>());
	inFile.close();
	
	// 处理HTML内容
	string processedContent = processHTML(content);
	
	// 写入输出文件
	ofstream outFile(outputFile);
	if (!outFile) {
		cerr << "Error: Could not open output file " << outputFile << endl;
		return 1;
	}
	
	outFile << processedContent;
	outFile.close();
	
	cout << "Successfully converted " << inputFile << " to dark mode and saved to " << outputFile << endl;
	
	return 0;
}
