/**
 * Created by HuDianxing on 2017-05-11.
 *
 * 重庆理念@黑龙江移动 标签打印逻辑的封装。
 *
 * Copyright(C) 2011~2017, 上海道臻信息技术有限公司
 *
 */
var LnPrinter = (function () {
    /**
     * 标签打印构造函数。
     * 注意：改文件依赖于LPAPI.js文件。
     * @constructor
     */
    function LnPrinter() {
        this._dtPrinter = new LPAPI();
    }

    var DEBUG = false;

    LnPrinter.getPrintNodes = function (xmlData) {
        try {
            var parser = new DOMParser();
            var xmlDocument = parser.parseFromString(xmlData, 'text/xml');
            return xmlDocument.getElementsByTagName(LnPrinter.TAG_PRINT);
        } catch (e) {
            return null;
        }
    };

    LnPrinter.getNodeValue = function(node){
        if (node && node.childNodes)
            return node.childNodes[0].nodeValue;

        return "";
    };

    /**
     * 获取所有已配对打印机。
     */
    LnPrinter.prototype.getAllPrinters = function () {
        return this._dtPrinter.getAllPrinters();
    };

    /**
     * 打开目标打印机。
     * @param printerName
     */
    LnPrinter.prototype.openPrinter = function(printerName){
        if (!printerName) printerName = "";

        return this._dtPrinter.openPrinterSync(printerName);
    };

    /**
     * 开启打印任务。
     * @param xmlData
     * @return {boolean}
     * @constructor
     */
    LnPrinter.prototype.print = function (xmlData) {
        var printNodes = LnPrinter.getPrintNodes(xmlData);
        if (!printNodes)
            return false;

        // 循环打印所有标签。
        for (var i = 0; i < printNodes.length; i++) {
            if (!this._printLabel(printNodes[i]))
                return false;
        }

        return true;
    };

    /**
     * 打印单张标签。
     * @param printNode
     * @return {boolean} 成功与否。
     * @private
     */
    LnPrinter.prototype._printLabel = function(printNode) {
        if (!printNode) return false;

        // Get PrintType
        var printTypeNodes = printNode.getElementsByTagName(LnPrinter.TAG_PRINT_TYPE);
        if (!printTypeNodes || printTypeNodes.length <= 0)
            return false;

        var printType = LnPrinter.getNodeValue(printTypeNodes[0]);
        // Get Code and text
        var code = "";
        var textList = new Array();
        var codeNodes = printNode.getElementsByTagName(LnPrinter.TAG_CODE);
        var textNodes = printNode.getElementsByTagName(LnPrinter.TAG_TEXT);
        if (codeNodes && codeNodes.length > 0)
            code = LnPrinter.getNodeValue(codeNodes[0]);
        if (textNodes && textNodes.length > 0) {
            for (var i = 0; i < textNodes.length; i++) {
                textList[i] = LnPrinter.getNodeValue(textNodes[i]);
            }
        }

        switch (printType){
            // 机房标签
            case "SITE":
            case "ROOM":
            case "ROOM_CORE":
            return this._printLabel_0(code, textList);
            // 机架
            case "T_PHY_SHELFRACK_UNIT":
            case "RACK":
            case "IRMS_RACK":
            case "TNMS_RACK":
                return this._printLabel_3(code, textList);
            // DDF架
            case "ODFMODULE":
            case "DDF":
                return this._printLabel_4(code, textList);
            // 设备及其他
            case "JUMP_FIBER":
            case "WIRE_SEG":
                return this._printLabel_5(code, textList);
            case "T_PHY_COM_POWER_DISTRIBU_G":
            case "T_PHY_COM_POWER_DISTRIBU_L":
            case "T_PHY_COM_POWER_FORMER":
            case "T_PHY_COM_POWER_AUTOMAIC":
            case "T_PHY_COM_POWER_GRNERAT":
            case "T_PHY_COM_POWER_SMPS":
            case "T_PHY_COM_POWER_UPS":
            case "T_PHY_COM_POWER_INVERTER":
            case "T_PHY_COM_POWER_DISTRIBU_EX":
            case "T_PHY_COM_POWER_DISTRIBU_DC":
            case "T_PHY_COM_POWER_STORAGE":
            case "T_PHY_COM_POWER_NA":
            case "T_PHY_COM_POWER_GRNERAT_M":
            case "T_PHY_COM_POWER_MME":
            case "T_PHY_COM_POWER_CACC":
            case "T_PHY_COM_POWER_CACH":
            case "T_PHY_COM_POWER_VOLTGE":
                return this._printLabel_power(code, textList);
            case "TRAPH":
                return this._printLabel_6(code, textList);
            case "DDFPORT":
            case "DDFMODULE":
            case "ODFPORT":
            case "ODM":
                return this._printLabel_ODM2(code, textList);
            default:
                return this._printLabel_device(code, textList);
        }
    };

    /**
     * 机房标签。
     */
    LnPrinter.prototype._printLabel_0 = function (code, textList){
        var width = 100;
        var height = 45;
        var header = 13;
        var orientation = 90;
        var fontHeight = 8;
        var fontStyle = 1;
        var margin = 5;
        var marginRight = 10;
        var qrcodeWidth = 25;

        if (!this._dtPrinter.startJob(width, height, orientation))
            return false;

        if (DEBUG){
            this._dtPrinter.drawRoundRectangle(0, 0, width, height);
        }

        this._dtPrinter.setItemVerticalAlignment(1);
        if (textList.length > 0)
            this._dtPrinter.drawText(textList[0], margin, header, width - margin * 2 - qrcodeWidth - marginRight, height - header, fontHeight, fontStyle);

        this._dtPrinter.setItemHorizontalAlignment(1);
        if (code)
            this._dtPrinter.draw2DQRCode(code, width - marginRight - qrcodeWidth, header, qrcodeWidth);

        return this._dtPrinter.commitJob();
    };

    /**
     * 设备标签。
     */
    LnPrinter.prototype._printLabel_device = function (code, textList) {
        var width = 90;
        var height = 30;
        var orientation = 90;
        var header = 9;
        var margin = 3;
        var marginRight = 10;
        var qrcodeWidth = 18;
        var fontHeight = 4.94;
        var fontStyle = 1;

        // 开始绘图任务，传入参数(页面宽度, 页面高度)
        if (!this._dtPrinter.startJob(width, height, orientation))
            return false;

        if (DEBUG){
            this._dtPrinter.drawRectangle(0, 0, width, height);
        }

        this._dtPrinter.setItemHorizontalAlignment(0);
        this._dtPrinter.setItemVerticalAlignment(1);

        // 开始一个页面的绘制，绘制文本字符串
        if (textList.length > 0)
            this._dtPrinter.drawText(textList[0], margin, header, width - margin * 2 - qrcodeWidth - marginRight, height - header, fontHeight, fontStyle);
        if (code)
            this._dtPrinter.draw2DQRCode(code, width - qrcodeWidth - marginRight, header, qrcodeWidth);

        // 结束绘图任务
        return this._dtPrinter.commitJob();
    };

    /**
     * 传输网资源交接箱标签。
     */
    LnPrinter.prototype._printLabel_2 = function (code, textList) {
        return this._printLabel_1(code, textList);
    };

    /**
     * 传输机架标签。
     */ 
    LnPrinter.prototype._printLabel_3 = function (code, textList) {
        var width = 100;
        var height = 45;
        var orientation = 90;
        var margin = 3;
        var header = 13;
        var qrcodeWidth = 22;
        var fontHeight = 3.704;
        var fontStyle = 1;

        // 开始绘图任务，传入参数(页面宽度, 页面高度)
        this._dtPrinter.startJob(width, height, orientation);
        if (DEBUG){
            this._dtPrinter.drawRectangle(0, 0, width, height);
        }

        this._dtPrinter.setItemHorizontalAlignment(0);
        this._dtPrinter.setItemVerticalAlignment(1);

        if (textList.length > 0)
            this._dtPrinter.drawText(textList[0], margin, header + margin, width - margin * 3 - qrcodeWidth, height - header - margin * 2, fontHeight, fontStyle);
        if (code)
            this._dtPrinter.draw2DQRCode(code, width - margin - qrcodeWidth, header + (height - header - qrcodeWidth)/2, qrcodeWidth);

        // 结束绘图任务
        return this._dtPrinter.commitJob();
    };

    /**
     * DDF/ODF架标签，100*45
     */
    LnPrinter.prototype._printLabel_4 = function (code, textList) {
        var width = 100;
        var height = 45;
        var qrcodeWidth = 22;
        var margin = 5;
        var orientation = 90;
        var fongHeight = 3.704;
        var fontStyle = 1;

        // 开始绘图任务，传入参数(页面宽度, 页面高度)
        this._dtPrinter.startJob(width, height, orientation);
        if (DEBUG){
            this._dtPrinter.drawRectangle(0, 0, width, height);
        }

        this._dtPrinter.setItemHorizontalAlignment(0);
        this._dtPrinter.setItemVerticalAlignment(1);
        // 开始一个页面的绘制，绘制文本字符串
        if (textList.length > 0)
            this._dtPrinter.drawText(textList[0], 34, 0, 65, 13, 5.292, 1);
        var content = "";
        for(var i = 1; i < textList.length; i++){
            if (textList[i]){
                content += (textList[i] + "\n");
            }
        }
        if (content.trim())
            this._dtPrinter.drawText(content.trim(), 6, 17, 65, 16, 3.704, 1);

        this._dtPrinter.setItemHorizontalAlignment(1);
        if (code)
            this._dtPrinter.draw2DQRCode(code, 73, 18, 22);

        // 结束绘图任务
        return this._dtPrinter.commitJob();
    };

    /**
     * 尾纤、2M线、光缆等， 45*45 T 型标签。
     */
    LnPrinter.prototype._printLabel_5 = function (code, textList) {
        var width = 45;
        var height = 45;
        var sheetHeight = height / 3;
        var orientation = 90;
        var fontHeight = 3.704;
        var fontStyle = 1;

        // 开始绘图任务，传入参数(页面宽度, 页面高度)
        this._dtPrinter.startJob(width, height, orientation);
        if (DEBUG){
            this._dtPrinter.drawRectangle(0, 0, width, height);
        }

        this._dtPrinter.setItemHorizontalAlignment(1);
        this._dtPrinter.setItemVerticalAlignment(1);

        // 开始一个页面的绘制，绘制文本字符串
        if (textList.length > 0)
            this._dtPrinter.drawText(textList[0], 0, 3, 45, 4.5, fontHeight, fontStyle);
        if (textList.length > 1)
            this._dtPrinter.drawText(textList[1], 0, 7.5, 45, 4.5, fontHeight, fontStyle);
        if (textList.length > 2)
            this._dtPrinter.drawText(textList[2], 5, 18, 40, 4.5, fontHeight, fontStyle);
        if (textList.length > 3)
            this._dtPrinter.drawText(textList[3], 5, 22.5, 40, 4.5, fontHeight, fontStyle);

        // 结束绘图任务
        return this._dtPrinter.commitJob();
    };

    /**
     * 传输电路，45*45 T型标签。
     */
    LnPrinter.prototype._printLabel_6 = function (code, textList) {
        var width = 45;
        var height = 45;
        var sheetHeight = height / 3;
        var orientation = 90;
        var fontHeight = 3.704;
        var fontStyle = 1;

        // 开始打印任务
        this._dtPrinter.startJob(45, 45, 90);
        if (DEBUG){
            this._dtPrinter.drawRectangle(0, 0, width, height);
        }

        this._dtPrinter.setItemHorizontalAlignment(0);
        this._dtPrinter.setItemVerticalAlignment(1);
        //
        if (textList.length > 0)
            this._dtPrinter.drawText(textList[0], 3, 0, 39, 8, fontHeight, fontStyle);
        if (textList.length > 1)
            this._dtPrinter.drawText(textList[1], 3, 7.5, 39, 8, fontHeight, fontStyle);
        this._dtPrinter.setItemHorizontalAlignment(1);
        if (textList.length > 2)
            this._dtPrinter.drawText(textList[2], 0, 15, 45, 15, fontHeight, fontStyle);

        // 提交打印任务
        return this._dtPrinter.commitJob();
    };

    /**
     * ODM/DDM端子标签。
     */
    LnPrinter.prototype._printLabel_ODM2 = function(code, textList){
        var width = 20;
        var height = 15;
        var orientation = 90;
        var fontHeight = 5;
        var fontStyle = 1;

        this._dtPrinter.startJob(width, height, orientation);
        if (DEBUG){
            this._dtPrinter.drawRoundRectangle(0, 0, width, height);
        }

        this._dtPrinter.setItemHorizontalAlignment(1);
        this._dtPrinter.setItemVerticalAlignment(1);

        var content = "";
        if (textList.length > 0)
            content += textList[0];
        if (textList.length > 1)
            content += (" " + textList[1]);

        if (content) this._dtPrinter.drawText(content, 0, 0, width, height, fontHeight, fontStyle);

        return this._dtPrinter.commitJob();

    };

    /**
     * 动力环境资源标签。
     */ 
    LnPrinter.prototype._printLabel_power = function (code, textList) {
        var width = 100;
        var height = 45;
        var header = 13;
        var orientation = 90;
        var margin = 3;
        var marginRight = 10;
        var qrcodeWidth = 22;
        var fontHeight = 4.5;
        var fontStyle = 1;

        // 开始绘图任务，传入参数(页面宽度, 页面高度)
        if (!this._dtPrinter.startJob(width, height, orientation))
            return false;

        if (DEBUG){
            this._dtPrinter.drawRoundRectangle(0, 0, width, height);
            this._dtPrinter.drawLine(0, header, width, header);
        }

        this._dtPrinter.setItemHorizontalAlignment(0);
        this._dtPrinter.setItemVerticalAlignment(1);

        if (textList.length > 0)
            this._dtPrinter.drawText(textList[0], margin, header + margin, width - margin - qrcodeWidth - marginRight * 2, height - header - margin * 2, fontHeight, fontStyle);
        if (code)
            this._dtPrinter.draw2DQRCode(code, width - qrcodeWidth - marginRight, header + (height - header - qrcodeWidth)/2);

        // 结束绘图任务
        return this._dtPrinter.commitJob();
    };

    LnPrinter.TAG_PRINT = "Print";
    LnPrinter.TAG_PRINT_TYPE = "CodeType";
    LnPrinter.TAG_CODE = "QRCode";
    LnPrinter.TAG_TEXT = "Text";

    return LnPrinter;
})();
